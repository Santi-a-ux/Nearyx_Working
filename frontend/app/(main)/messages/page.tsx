"use client";

import { Suspense, useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertCircle, Loader2, MoreHorizontal, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";

/* ---------------- TYPES (sin cambios) ---------------- */

interface Message {
  id: string;
  conversation_id?: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface MyUserProfile {
  user_id: string;
}

interface ConversationSummary {
  id: string;
  participant_ids: string[];
  other_participant_id?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  updated_at?: string;
}

interface UserProfileSummary {
  display_name?: string;
  avatar_url?: string;
}

interface ConversationItem extends ConversationSummary {
  partnerName: string;
  partnerAvatar?: string;
}

/* ---------------- COMPONENT ---------------- */

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const initialReceiverId = searchParams.get("userId") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [receiverId, setReceiverId] = useState(initialReceiverId);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [receiverProfile, setReceiverProfile] = useState<UserProfileSummary | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const receiverIdRef = useRef(initialReceiverId);
  const conversationIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    window.setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 0);
  };

  useEffect(() => {
    receiverIdRef.current = receiverId;
  }, [receiverId]);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());

  /* ---------------- CONVERSATIONS ---------------- */

  const loadConversations = async () => {
    try {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) throw new Error();

      const list = (await response.json()) as ConversationSummary[];

      const enriched = await Promise.all(
        list.map(async (conversation) => {
          const partnerId =
            conversation.other_participant_id ||
            conversation.participant_ids.find((id) => id !== meId) ||
            "";

          const profile = partnerId
            ? await fetchApi<UserProfileSummary>(`/users/profiles/${partnerId}`).catch(() => null)
            : null;

          return {
            ...conversation,
            partnerName: profile?.display_name || `Chat ${partnerId.slice(0, 8)}`,
            partnerAvatar: profile?.avatar_url,
          };
        })
      );

      setConversations(enriched);
    } catch {
      setConversations([]);
    }
  };

  /* ---------------- CHAT HISTORY ---------------- */

  const loadConversationMessages = async (convId: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${convId}`);
      if (!response.ok) return;

      const history = await response.json();

      setMessages(
        history.map((msg: any) => ({
          id: String(msg.id),
          conversation_id: convId,
          sender_id: String(msg.sender_id),
          receiver_id: receiverIdRef.current,
          content: msg.content,
          timestamp: msg.created_at,
          is_read: msg.is_read,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const ensureConversation = async (participantId: string) => {
    try {
      const response = await fetch("/api/chat/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participant_id: participantId }),
      });

      const data = await response.json();

      setConversationId(data.id);
      await loadConversationMessages(data.id);
    } catch {
      setConversationId(null);
    }
  };

  const openConversation = async (participantId: string) => {
    if (!participantId || !isUuid(participantId)) return;

    setReceiverId(participantId);
    setReceiverProfile(null);
    await ensureConversation(participantId);
  };

  /* ---------------- SESSION ---------------- */

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((user: MyUserProfile) => setMeId(user.user_id))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (meId) loadConversations();
  }, [meId]);

  // If the page was opened with a userId (from profile -> "Enviar Mensaje"),
  // ensure the conversation exists and load its messages once we know `meId`.
  useEffect(() => {
    if (!meId) return;
    if (receiverId && isUuid(receiverId)) {
      void ensureConversation(receiverId);
    }
  }, [meId, receiverId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, conversationId]);

  useEffect(() => {
    if (!meId) {
      return;
    }

    let cancelled = false;

    const connectWebSocket = async () => {
      try {
        const tokenResponse = await fetch("/api/auth/ws-token");
        if (!tokenResponse.ok) {
          const errBody = await tokenResponse.json().catch(() => ({}));
          const msg = errBody?.error || `WS token fetch failed (${tokenResponse.status})`;
          toast.error(msg);
          console.error("WS token fetch failed:", tokenResponse.status, errBody);
          throw new Error(msg);
        }

        const { token } = await tokenResponse.json();
        if (cancelled) return;

        const wsBaseUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.hostname}:8000/chat/ws`;
        const ws = new WebSocket(`${wsBaseUrl}/${meId}?token=${token}`);

        ws.onopen = () => {
          setIsConnected(true);
          console.info("WS open for meId:", meId);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            setMessages((prev: Message[]) => [
              ...prev,
              {
                id: crypto.randomUUID(),
                conversation_id: data.conversation_id || conversationIdRef.current || undefined,
                sender_id: String(data.sender_id || ""),
                receiver_id: receiverIdRef.current,
                content: data.content || "",
                timestamp: new Date().toISOString(),
                is_read: false,
              },
            ]);
          } catch (error) {
            console.error("Error parseando mensaje WS:", error);
          }
        };

        ws.onclose = (ev) => {
          setIsConnected(false);
          console.warn("WS closed", ev);
          toast.error("Conexión de chat cerrada.");
        };

        ws.onerror = (ev) => {
          setIsConnected(false);
          console.error("WS error", ev);
          toast.error("Error en la conexión de chat.");
        };

        wsRef.current = ws;
        setSocket(ws);
      } catch (error) {
        console.error("Error conectando WebSocket:", error);
        setIsConnected(false);
      }
    };

    void connectWebSocket();

    return () => {
      cancelled = true;
      wsRef.current?.close();
      wsRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [meId]);

  /* ---------------- UI HELPERS ---------------- */

  const activeConversation = useMemo<ConversationItem | null>(
    () => conversations.find((conversation: ConversationItem) => conversation.other_participant_id === receiverId) || null,
    [conversations, receiverId]
  );

  const resolvedName =
    receiverProfile?.display_name ||
    activeConversation?.partnerName ||
    (receiverId ? `Chat ${receiverId.slice(0, 8)}` : "Selecciona un chat");

  const resolvedAvatar =
    receiverProfile?.avatar_url ||
    activeConversation?.partnerAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${receiverId || "empty"}`;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-text)]" />
      </div>
    );
  }

  /* ---------------- UI ---------------- */

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    const activeSocket = wsRef.current;
    const socketIsOpen = activeSocket?.readyState === WebSocket.OPEN;

    if (!activeSocket || !socketIsOpen || !meId || !conversationIdRef.current) {
      toast.error("No estás conectado al servidor de chat.");
      return;
    }

    const payload = {
      conversation_id: conversationIdRef.current,
      receiver_id: receiverIdRef.current,
      content: newMessage,
    };

    activeSocket.send(JSON.stringify(payload));

    const optimisticMessage: Message = {
      id: Math.random().toString(),
      conversation_id: conversationIdRef.current,
      sender_id: meId || "me",
      receiver_id: receiverIdRef.current,
      content: newMessage,
      timestamp: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev: Message[]) => [...prev, optimisticMessage]);
    setNewMessage("");
    void loadConversations();

    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[var(--color-bg)]">
      <div className="flex h-full min-h-0 w-full gap-3 p-3 lg:p-4">
        <aside className="flex min-h-0 w-[360px] flex-col overflow-hidden rounded-[22px] border border-[rgba(253, 251, 212, 0.25)] bg-[var(--color-surface)] shadow-[0_24px_60px_rgba(56, 36, 13, 0.28)]">
          <div className="flex-shrink-0 border-b border-[rgba(253, 251, 212, 0.25)] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
                  Mensajes
                </p>
                <h2 className="mt-2 text-[1.05rem] font-semibold text-[var(--color-bg)]">
                  Conversaciones
                </h2>
              </div>

              <span className="rounded-full border border-[rgba(253, 251, 212, 0.25)] px-3 py-1 text-[11px] font-medium text-[rgba(253,251,212,0.8)]">
                {isConnected ? "En línea" : "Desconectado"}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 border-b border-[rgba(253, 251, 212, 0.25)] px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <Input
                placeholder="Buscar conversaciones..."
                className="h-11 rounded-xl border border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.06)] pl-10 text-[var(--color-bg)] placeholder:text-[rgba(253,251,212,0.5)] focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2.5">
                {conversations.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-[18px] border border-dashed border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.03)] px-6 text-center">
                    <div className="space-y-2">
                      <AlertCircle className="mx-auto h-5 w-5 text-[var(--color-text-muted)]" />
                      <p className="text-sm text-[rgba(253,251,212,0.72)]">No hay conversaciones aún</p>
                    </div>
                  </div>
                ) : (
                  conversations.map((c: ConversationItem) => {
                    const partnerId = c.other_participant_id || c.participant_ids.find((id) => id !== meId) || "";
                    const isActive = partnerId === receiverId;

                    return (
                      <button
                        key={c.id}
                        onClick={() => openConversation(partnerId)}
                        className={`group w-full rounded-[18px] border px-4 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? "border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.08)] shadow-[inset_0_0_0_1px_rgba(253,251,212,0.04)]"
                            : "border-transparent hover:border-[rgba(253, 251, 212, 0.25)] hover:bg-[rgba(253,251,212,0.05)]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-11 w-11 flex-shrink-0 border border-[rgba(253, 251, 212, 0.25)]">
                            <AvatarImage src={c.partnerAvatar} />
                            <AvatarFallback className="bg-[var(--color-bg)] text-[var(--color-surface)]">
                              {c.partnerName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-[var(--color-bg)]">
                                  {c.partnerName}
                                </div>
                                <div className="mt-1 truncate text-xs text-[rgba(253,251,212,0.68)]">
                                  {c.last_message || "Sin mensajes"}
                                </div>
                              </div>

                              {c.last_message_at && (
                                <div className="flex-shrink-0 text-[11px] text-[rgba(253,251,212,0.55)]">
                                  {new Date(c.last_message_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-[rgba(253, 251, 212, 0.25)] bg-[var(--color-surface)] shadow-[0_24px_60px_rgba(56, 36, 13, 0.28)]">
          <div className="flex-shrink-0 border-b border-[rgba(253, 251, 212, 0.25)] px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="h-11 w-11 flex-shrink-0 border border-[rgba(253, 251, 212, 0.25)]">
                  <AvatarImage src={resolvedAvatar} />
                  <AvatarFallback className="bg-[var(--color-bg)] text-[var(--color-surface)]">
                    {resolvedName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-[var(--color-bg)]">
                    {resolvedName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[rgba(253,251,212,0.66)]">
                    <span className="h-2 w-2 rounded-full bg-[#d7f0b2]" />
                    <span>{conversationId ? "En línea" : "Selecciona un chat"}</span>
                  </div>
                </div>
              </div>

              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(253, 251, 212, 0.25)] text-[rgba(253,251,212,0.72)] transition-all hover:bg-[rgba(253,251,212,0.06)] hover:text-[var(--color-bg)]">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-5">
            <ScrollArea ref={scrollRef} className="h-full pr-2">
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex min-h-[24rem] items-center justify-center rounded-[18px] border border-dashed border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.03)] px-6 text-center">
                    <p className="text-sm text-[rgba(253,251,212,0.7)]">Inicia una conversación</p>
                  </div>
                ) : (
                  messages.map((m: Message) => {
                    const isMe = m.sender_id === meId;
                    const time = new Date(m.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={m.id}
                        className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        {!isMe && (
                          <Avatar className="h-8 w-8 flex-shrink-0 border border-[rgba(253, 251, 212, 0.25)]">
                            <AvatarImage src={resolvedAvatar} />
                            <AvatarFallback className="bg-[var(--color-bg)] text-[var(--color-surface)] text-xs">
                              {resolvedName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`flex max-w-[min(34rem,78%)] flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-[18px] border px-4 py-3 shadow-[0_12px_24px_rgba(0,0,0,0.08)] ${
                              isMe
                                ? "rounded-br-md border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.08)] text-[var(--color-bg)]"
                                : "rounded-bl-md border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.04)] text-[rgba(253,251,212,0.96)]"
                            }`}
                          >
                            <p className="break-words text-sm leading-6">{m.content}</p>
                          </div>
                          <span className="mt-1.5 text-[11px] text-[rgba(253,251,212,0.52)]">
                            {time}
                          </span>
                        </div>

                        {isMe && (
                          <Avatar className="h-8 w-8 flex-shrink-0 border border-[rgba(253, 251, 212, 0.25)]">
                            <AvatarImage src={resolvedAvatar} />
                            <AvatarFallback className="bg-[var(--color-bg)] text-[var(--color-surface)] text-xs">
                              {resolvedName.slice(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 border-t border-[rgba(253, 251, 212, 0.25)] px-4 py-4 lg:px-5">
            <form className="flex items-end gap-3" onSubmit={handleSendMessage}>
              <Input
                value={newMessage}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setNewMessage(event.target.value)}
                className="h-12 rounded-xl border border-[rgba(253, 251, 212, 0.25)] bg-[rgba(253,251,212,0.06)] px-4 text-[var(--color-bg)] placeholder:text-[rgba(253,251,212,0.45)] focus-visible:ring-0"
                placeholder="Escribe un mensaje..."
              />
              <Button
                type="submit"
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-bg)] text-[var(--color-surface)] transition-all hover:opacity-90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------------- WRAPPER ---------------- */

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
      <MessagesPageContent />
    </Suspense>
  );
}