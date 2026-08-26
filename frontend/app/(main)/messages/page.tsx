"use client";

import { Suspense, useEffect, useMemo, useState, useRef, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/user-avatar";
import { AlertCircle, CalendarDays, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchApi } from "@/lib/api";
import { appPanelClass, appPanelSoftClass } from "@/lib/surface-styles";
import { useScreenReader } from "@/components/providers/ScreenReaderContext";

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
  display_name?: string;
  avatar_url?: string;
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
  const router = useRouter();
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
  const [meDisplayName, setMeDisplayName] = useState("Tú");
  const [meAvatar, setMeAvatar] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [receiverProfile, setReceiverProfile] = useState<UserProfileSummary | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(60);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const { speak, stop } = useScreenReader();

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

  const loadReceiverProfile = async (participantId: string) => {
    if (!participantId || !isUuid(participantId)) {
      setReceiverProfile(null);
      return;
    }

    const profile = await fetchApi<UserProfileSummary>(`/users/profiles/${participantId}`).catch(() => null);
    setReceiverProfile(profile);
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
    await loadReceiverProfile(participantId);
    await ensureConversation(participantId);
  };

  /* ---------------- SESSION ---------------- */

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((user: MyUserProfile) => {
        setMeId(user.user_id);
        setMeDisplayName(user.display_name || "Tú");
        setMeAvatar(user.avatar_url);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (meId) loadConversations();
  }, [meId]);

  useEffect(() => {
    if (!meId || !receiverId || !isUuid(receiverId)) {
      return;
    }

    void openConversation(receiverId);
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
            const messageContent = data.content || "";
            const senderId = String(data.sender_id || "");

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
              if (senderId !== meId && messageContent) {
              speak(`Nuevo mensaje de ${resolvedName}: ${messageContent}`);
            }
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
    () =>
      conversations.find((conversation: ConversationItem) => {
        const partnerId =
          conversation.other_participant_id ||
          conversation.participant_ids.find((id) => id !== meId) ||
          "";
        return partnerId === receiverId;
      }) || null,
    [conversations, receiverId, meId]
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    window.dispatchEvent(new Event("nearyx:network-updated"));

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

  const openBookingDialog = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);

    const nextDate = now.toISOString().slice(0, 10);
    const nextTime = now.toTimeString().slice(0, 5);

    setBookingDate(nextDate);
    setBookingTime(nextTime);
    setBookingDurationMinutes(60);
    setBookingDialogOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!receiverId || !isUuid(receiverId) || !bookingDate || !bookingTime || bookingSubmitting) {
      return;
    }

    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    if (Number.isNaN(startDateTime.getTime())) {
      toast.error("Selecciona una fecha y hora válidas.");
      return;
    }

    const endDateTime = new Date(startDateTime.getTime() + Math.max(30, bookingDurationMinutes) * 60 * 1000);

    setBookingSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutor_id: receiverId,
          scheduled_start: startDateTime.toISOString(),
          scheduled_end: endDateTime.toISOString(),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.detail || "No se pudo crear la reserva");
      }

      toast.success("Reserva creada");
      speak(`Reserva con ${resolvedName} creada correctamente.`);
      setBookingDialogOpen(false);
      router.push("/bookings");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "No se pudo crear la reserva");
      speak(
          err.message
            ? `No se pudo crear la reserva. ${err.message}`
            : "No se pudo crear la reserva."
        );
    } finally {
      setBookingSubmitting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-[#ffffff]">
      <div className="flex h-full min-h-0 w-full gap-4 p-3 lg:p-4">
        <aside className={`flex min-h-0 w-[360px] flex-col overflow-hidden ${appPanelSoftClass}`}>
          <div
                tabIndex={0}
                onFocus={() =>
                  speak(
                    `Sección Mensajes. Conversaciones. ${
                      conversations.length
                    } conversaciones disponibles. Estado de conexión: ${
                      isConnected ? "en línea" : "desconectado"
                    }.`
                  )
                }
                onBlur={stop}
                className="flex-shrink-0 rounded-md border-b border-border px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
              >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.26em] text-muted-foreground">
                  Mensajes
                </p>
                <h2 className="mt-2 text-[1.05rem] font-semibold text-foreground">
                  Conversaciones
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                  isConnected
                    ? "bg-semantic-success/10 text-semantic-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {isConnected ? "En línea" : "Desconectado"}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 border-b border-border px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversaciones..."
                aria-label="Buscar conversaciones"
                onFocus={() => speak("Campo de búsqueda. Buscar conversaciones.")}
                onBlur={stop}
                className="h-11 rounded-xl border-border bg-[#ffffff] pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-2.5">
                {conversations.length === 0 ? (
                  <div
                  tabIndex={0}
                  onFocus={() => speak("No hay conversaciones aún.")}
                  onBlur={stop}
                  aria-label="No hay conversaciones aún"
                  className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border bg-[#ffffff] px-6 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <div className="space-y-2">
                      <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">No hay conversaciones aún</p>
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
                        onFocus={() =>
                              speak(
                                `Conversación con ${c.partnerName}. ${
                                  c.last_message
                                    ? `Último mensaje: ${c.last_message}.`
                                    : "Sin mensajes."
                                }`
                              )
                            }
                            onBlur={stop}
                            aria-label={`Conversación con ${c.partnerName}. ${
                              c.last_message
                                ? `Último mensaje: ${c.last_message}.`
                                : "Sin mensajes."
                            }`}
                        className={`group w-full rounded-xl border px-4 py-3 text-left transition-all duration-200 ${
                          isActive
                            ? "border-[#95C9FC] bg-[#C6E2FE] shadow-sm"
                            : "border-transparent hover:border-border hover:bg-[#F8FBFF]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <UserAvatar name={c.partnerName} size="mlg" avatarUrl={c.partnerAvatar} />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-foreground">
                                  {c.partnerName}
                                </div>
                                <div className="mt-1 truncate text-xs text-muted-foreground">
                                  {c.last_message || "Sin mensajes"}
                                </div>
                              </div>

                              {c.last_message_at && (
                                <div className="flex-shrink-0 text-[11px] text-muted-foreground">
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

        <section className={`flex min-w-0 flex-1 flex-col overflow-hidden ${appPanelClass}`}>
         <div
            tabIndex={0}
            onFocus={() =>
              speak(
                receiverId && isUuid(receiverId)
                  ? `Chat con ${resolvedName}. ${
                      conversationId ? "En línea." : "Selecciona un chat."
                    }`
                  : "No hay ninguna conversación seleccionada."
              )
            }
            onBlur={stop}
            className="flex-shrink-0 rounded-md border-b border-border px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={resolvedName} size="mlg" avatarUrl={resolvedAvatar} />

                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">
                    {resolvedName}
                  </h3>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-semantic-success" />
                    <span>{conversationId ? "En línea" : "Selecciona un chat"}</span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
              {receiverId && isUuid(receiverId) ? (
                <>
                  <Link
                    href={`/profile/${receiverId}`}
                    className="inline-flex h-10 items-center rounded-full border border-[#2563EB]/20 bg-[#EEF6FF] px-4 text-sm font-semibold text-[#2563EB] transition-colors hover:bg-[#E0EFFF]"
                    aria-label={`Ver perfil de ${resolvedName}`}
                    onFocus={() => speak(`Botón. Ver perfil de ${resolvedName}.`)}
                    onBlur={stop}
                  >
                    Ver perfil
                  </Link>
                  <Button
                    type="button"
                    onClick={openBookingDialog}
                    aria-label={`Reservar una sesión con ${resolvedName}`}
                    onFocus={() =>
                      speak(`Botón. Reservar una sesión con ${resolvedName}.`)
                    }
                    onBlur={stop}
                    className="h-10 rounded-full bg-[#95C9FC] px-4 text-sm font-semibold text-[#10314F] hover:bg-[#7FB8F5]"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    Reservar
                  </Button>
                </>
              ) : null}
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-4 py-4 lg:px-5">
            <ScrollArea ref={scrollRef} className="h-full pr-2">
              <div className="flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div
                  tabIndex={0}
                  onFocus={() => speak("No hay mensajes. Inicia una conversación.")}
                  onBlur={stop}
                  aria-label="No hay mensajes. Inicia una conversación."
                  className="flex min-h-[24rem] items-center justify-center rounded-xl border border-dashed border-border bg-[#F8FBFF] px-6 text-center focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <p className="text-sm text-muted-foreground">Inicia una conversación</p>
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
                        tabIndex={0}
                        onFocus={() =>
                          speak(
                            `${isMe ? "Tú" : resolvedName} dijo: ${m.content}. Hora: ${time}.`
                          )
                        }
                        onBlur={stop}
                        aria-label={`${isMe ? "Tú" : resolvedName} dijo: ${m.content}. Hora: ${time}.`}
                        className={`flex items-end gap-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                          isMe ? "flex-row-reverse" : ""
                        }`}
                      >
                        {!isMe && (
                          <UserAvatar name={resolvedName} size="sm" avatarUrl={resolvedAvatar} />
                        )}

                        <div className={`flex max-w-[min(34rem,78%)] flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl border px-4 py-3 shadow-sm ${
                              isMe
                                ? "rounded-br-md border-[#95C9FC] bg-[#95C9FC] text-[#10314f]"
                                : "rounded-bl-md border-border bg-[#F8FBFF] text-foreground"
                            }`}
                          >
                            <p className="break-words text-sm leading-6">{m.content}</p>
                          </div>
                          <span className="mt-1.5 text-[11px] text-muted-foreground">
                            {time}
                          </span>
                        </div>

                        {isMe && (
                          <UserAvatar name={meDisplayName} size="sm" avatarUrl={meAvatar} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 border-t border-border px-4 py-4 lg:px-5">
            <form className="flex items-end gap-3" onSubmit={handleSendMessage}>
              <Input
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              onFocus={() => speak("Campo de mensaje. Escribe un mensaje.")}
              onBlur={stop}
              aria-label="Escribe un mensaje"
              className="h-12 rounded-xl border-border bg-[#F8FBFF] px-4 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/20"
            />
            <Button
              type="submit"
              aria-label="Enviar mensaje"
              onFocus={() => speak("Botón. Enviar mensaje.")}
              onBlur={stop}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#CCFBF1] text-[#0F766E] transition-all hover:bg-[#B2F5EA]"
            >
                <Send
                aria-hidden="true"
                className="h-4 w-4"
              />
             </Button>
            </form>
          </div>
        </section>
      </div>

      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="w-[min(92vw,460px)]
        "
        >
          <DialogHeader>
            <DialogTitle
              onFocus={() =>
                speak(`Crear reserva con ${resolvedName}.`)
              }
              tabIndex={0}
            >
              Crear reserva
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label
              className="text-sm font-medium text-foreground"
              htmlFor="booking-date"
            >
              Fecha
            </label>

            <Input
              id="booking-date"
              type="date"
              aria-label="Fecha de la reserva"
              value={bookingDate}
              onChange={(event) => setBookingDate(event.target.value)}
              onFocus={() =>
                speak(
                  bookingDate
                    ? `Fecha de la reserva: ${bookingDate}.`
                    : "Selecciona la fecha de la reserva."
                )
              }
              onBlur={stop}
            />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="booking-time">Hora</label>
              <Input
                id="booking-time"
                type="time"
                aria-label="Hora de la reserva"
                value={bookingTime}
                onChange={(event) => setBookingTime(event.target.value)}
                onFocus={() =>
                  speak(
                    bookingTime
                      ? `Hora de la reserva: ${bookingTime}.`
                      : "Selecciona la hora de la reserva."
                  )
                }
                onBlur={stop}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium text-foreground" htmlFor="booking-duration">Duración en minutos</label>
               <Input
                id="booking-duration"
                type="number"
                min={30}
                step={15}
                aria-label="Duración de la reserva en minutos"
                value={bookingDurationMinutes}
                onChange={(event) =>
                  setBookingDurationMinutes(Number(event.target.value) || 60)
                }
                onFocus={() =>
                  speak(
                    `Duración de la reserva: ${bookingDurationMinutes} minutos.`
                  )
                }
                onBlur={stop}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBookingDialogOpen(false)}
              onFocus={() => speak("Botón. Cancelar reserva.")}
              onBlur={stop}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCreateBooking}
              disabled={bookingSubmitting}
              onFocus={() =>
                speak(
                  bookingSubmitting
                    ? "Creando reserva."
                    : "Botón. Confirmar reserva."
                )
              }
              onBlur={stop}
            >
              {bookingSubmitting ? "Creando..." : "Confirmar reserva"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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