import { WebSocketServer } from 'ws';
import { DomainError } from '../../domain/errors/index.js';
import { incomingFrameSchema } from '../schemas/chat.schemas.js';
import { toRealtimeMessageDto } from '../dtos/chat.dto.js';

const PATH_RE = /^\/chat\/ws\/([^/]+)\/?$/;
const POLICY_VIOLATION = 1008;
const HEARTBEAT_MS = 30_000;

function cookieValue(header, name) {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

/**
 * WebSocket endpoint: /chat/ws/:user_id?token=<JWT>
 * The `token` cookie (httpOnly session) and the query param are both accepted.
 */
export function attachChatSocket(server, { identityService, chatService, userChannels }) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    let clientId;
    try {
      const { pathname } = new URL(req.url, 'http://localhost');
      const match = PATH_RE.exec(pathname);
      if (!match) return socket.destroy();
      clientId = decodeURIComponent(match[1]).toLowerCase();
    } catch {
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req, clientId));
  });

  wss.on('connection', (ws, req, clientId) => {
    const url = new URL(req.url, 'http://localhost');
    const candidates = [cookieValue(req.headers.cookie, 'token'), url.searchParams.get('token')].filter(Boolean);

    let identity = null;
    for (const token of candidates) {
      try {
        identity = identityService.authenticate(token);
        break;
      } catch {
        /* try the next candidate */
      }
    }
    // Same close code as the Python service when the token is missing/invalid or belongs to someone else.
    if (!identity || identity.userId !== clientId) return ws.close(POLICY_VIOLATION);

    const { userId } = identity;
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('error', (err) => console.error('[chat-ws]', err.message));

    userChannels.attach(userId, ws).catch((err) => {
      console.error('[chat-ws] subscribe failed', err);
      ws.close(1011);
    });

    const handleFrame = async (raw) => {
      let frame;
      try {
        frame = incomingFrameSchema.safeParse(JSON.parse(raw.toString()));
      } catch {
        return console.warn(`[chat-ws] ${userId}: frame is not valid JSON`);
      }
      if (!frame.success) return console.warn(`[chat-ws] ${userId}: invalid frame`);

      try {
        const { message, recipientIds } = await chatService.sendMessage(userId, {
          conversationId: frame.data.conversation_id,
          content: frame.data.content,
        });
        const dto = toRealtimeMessageDto(message);
        await Promise.all(recipientIds.map((id) => userChannels.publishToUser(id, dto)));
      } catch (err) {
        if (err instanceof DomainError) console.warn(`[chat-ws] ${userId}: ${err.message}`);
        else console.error('[chat-ws]', err);
      }
    };

    // Frames of one socket are processed in order.
    let queue = Promise.resolve();
    ws.on('message', (raw) => { queue = queue.then(() => handleFrame(raw)); });

    ws.on('close', () => {
      userChannels.detach(userId, ws).catch((err) => console.error('[chat-ws] detach failed', err));
    });
  });

  // Drops half-open connections (browsers closed without a FIN, proxies idling out).
  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) { ws.terminate(); continue; }
      ws.isAlive = false;
      ws.ping();
    }
  }, HEARTBEAT_MS);
  heartbeat.unref();

  return {
    close() {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.terminate();
      wss.close();
    },
  };
}
