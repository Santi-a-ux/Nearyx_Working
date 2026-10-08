const OPEN = 1; // WebSocket.OPEN

const channelFor = (userId) => `user_${userId}`;

/**
 * Tracks the sockets of each connected user and bridges them to the user's Redis channel
 * (`user_<id>`), so a message published by any instance reaches every socket of that user.
 */
export class UserChannels {
  constructor({ broker }) {
    this.broker = broker;
    this.entries = new Map(); // userId -> { sockets: Set<ws>, unsubscribe: Promise<() => Promise<void>> }
  }

  attach(userId, socket) {
    let entry = this.entries.get(userId);
    if (!entry) {
      entry = { sockets: new Set(), unsubscribe: null };
      const current = entry;
      entry.unsubscribe = this.broker.subscribe(channelFor(userId), (raw) => {
        for (const ws of current.sockets) if (ws.readyState === OPEN) ws.send(raw);
      });
      this.entries.set(userId, entry);
    }
    entry.sockets.add(socket);
    return entry.unsubscribe.then(() => undefined);
  }

  async detach(userId, socket) {
    const entry = this.entries.get(userId);
    if (!entry) return;
    entry.sockets.delete(socket);
    if (entry.sockets.size === 0) {
      this.entries.delete(userId);
      try {
        const unsubscribe = await entry.unsubscribe;
        await unsubscribe();
      } catch (err) {
        console.error('[user-channels] unsubscribe failed', err.message);
      }
    }
  }

  publishToUser(userId, payload) {
    return this.broker.publish(channelFor(userId), JSON.stringify(payload));
  }
}
