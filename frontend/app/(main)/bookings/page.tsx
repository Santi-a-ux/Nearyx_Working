"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Clock, User } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Booking {
  id: string;
  student_id: string;
  tutor_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  created_at: string;
}

interface BookingEnriched extends Booking {
  otherName: string;
  otherAvatar?: string;
  otherRole: string;
}

interface Session {
  user_id: string;
  role: string;
}

const STATUS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendiente", variant: "default" },
  confirmed: { label: "Confirmada", variant: "secondary" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  completed: { label: "Completada", variant: "outline" },
};

const HIDDEN_STATUSES = new Set(["cancelled"]);

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, sessionRes] = await Promise.all([
        fetch("/api/bookings", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/session", { cache: "no-store" }).then((r) => r.json()),
      ]);

      const raw: Booking[] = Array.isArray(bookingsRes) ? bookingsRes : [];
      const session: Session = sessionRes;

      const active = raw.filter((b) => !HIDDEN_STATUSES.has(b.status));

      const enriched = await Promise.all(
        active.map(async (b) => {
          const otherId = session.user_id === b.student_id ? b.tutor_id : b.student_id;
          const otherRole = session.user_id === b.student_id ? "Experto" : "Estudiante";
          try {
            const profile = await fetch(`/api/users/profiles/${otherId}`, { cache: "no-store" }).then((r) => r.json());
            return {
              ...b,
              otherName: profile.display_name || otherId.slice(0, 8),
              otherAvatar: profile.avatar_url,
              otherRole,
            };
          } catch {
            return { ...b, otherName: otherId.slice(0, 8), otherRole };
          }
        })
      );

      setBookings(enriched);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId, status: "cancelled" }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || data.detail || "No se pudo eliminar la reserva");
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Reserva eliminada");
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || "No se pudo eliminar la reserva");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Agenda</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Mis reservas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sesiones activas y confirmadas</p>
      </div>

      {loading ? (
        <Card className="p-0">
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando...</CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed p-0">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No tienes reservas activas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s = STATUS[b.status] ?? { label: b.status, variant: "outline" as const };
            const isCancelling = cancellingId === b.id;

            return (
              <Card key={b.id} className="p-0 shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={b.otherName} size="mlg" avatarUrl={b.otherAvatar} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{b.otherRole}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{b.otherName}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span>{fmt(b.scheduled_start)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Hasta: {fmt(b.scheduled_end)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge variant={s.variant} className="rounded-full">
                      {s.label}
                    </Badge>
                    {b.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCancelling}
                        onClick={() => handleCancelBooking(b.id)}
                      >
                        {isCancelling ? "Eliminando..." : "Eliminar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
