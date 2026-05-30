"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  pending:   { label: "Pendiente",  variant: "default" },
  confirmed: { label: "Confirmada", variant: "secondary" },
  cancelled: { label: "Destructive", variant: "destructive" },
  completed: { label: "Completada", variant: "outline" },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingEnriched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [bookingsRes, sessionRes] = await Promise.all([
          fetch("/api/bookings").then((r) => r.json()),
          fetch("/api/session").then((r) => r.json()),
        ]);

        const raw: Booking[] = Array.isArray(bookingsRes) ? bookingsRes : [];
        const session: Session = sessionRes;
        const isTutor = session.role === "tutor";

        const enriched = await Promise.all(
          raw.map(async (b) => {
            const otherId = isTutor ? b.student_id : b.tutor_id;
            const otherRole = isTutor ? "Estudiante" : "Tutor";
            try {
              const profile = await fetch(`/api/users/profiles/${otherId}`).then((r) => r.json());
              return { ...b, otherName: profile.display_name || otherId.slice(0, 8), otherAvatar: profile.avatar_url, otherRole };
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
    })();
  }, []);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("es-CO", {
      weekday: "short", day: "2-digit", month: "short",
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Agenda</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Mis reservas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Historial de sesiones agendadas</p>
      </div>

      {loading ? (
        <Card className="p-0">
          <CardContent className="p-6 text-sm text-muted-foreground">Cargando...</CardContent>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="border-dashed p-0">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No tienes reservas aún</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s = STATUS[b.status] ?? { label: b.status, variant: "outline" as const };
            return (
              <Card key={b.id} className="p-0 shadow-sm">
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 shrink-0 border border-border">
                      <AvatarImage src={b.otherAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.otherName}`} />
                      <AvatarFallback className="bg-[#95C9FC] text-[#10314f] font-semibold">
                        {b.otherName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
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
                  <Badge variant={s.variant} className="shrink-0 rounded-full">
                    {s.label}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
