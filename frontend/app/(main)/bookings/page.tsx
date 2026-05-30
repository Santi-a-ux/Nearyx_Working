"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendiente",  color: "#C4783A" },
  confirmed: { label: "Confirmada", color: "#4ade80" },
  cancelled: { label: "Cancelada",  color: "#f87171" },
  completed: { label: "Completada", color: "rgba(56,36,13,0.4)" },
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
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#38240D", fontFamily: "var(--font-main)" }}>
          Mis reservas
        </h1>
        <p className="mt-1 text-sm" style={{ color: "rgba(56,36,13,0.55)", fontFamily: "var(--font-main)" }}>
          Historial de sesiones agendadas
        </p>
      </div>

      {loading ? (
        <p className="text-sm" style={{ color: "rgba(56,36,13,0.5)" }}>Cargando...</p>
      ) : bookings.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center"
          style={{ borderColor: "rgba(56,36,13,0.12)", backgroundColor: "rgba(56,36,13,0.03)" }}>
          <CalendarDays className="mx-auto mb-3 h-10 w-10" style={{ color: "rgba(56,36,13,0.25)" }} />
          <p className="text-sm font-medium" style={{ color: "rgba(56,36,13,0.5)" }}>No tienes reservas aún</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const s = STATUS_LABEL[b.status] ?? { label: b.status, color: "#C4783A" };
            return (
              <div key={b.id} className="rounded-2xl border p-4 shadow-sm"
                style={{ borderColor: "rgba(56,36,13,0.12)", backgroundColor: "#fff" }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={b.otherAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${b.otherName}`} />
                      <AvatarFallback style={{ backgroundColor: "rgba(196,120,58,0.15)", color: "#C4783A" }}>
                        {b.otherName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(56,36,13,0.45)" }}>
                        <User className="h-3 w-3" />
                        <span>{b.otherRole}</span>
                      </div>
                      <p className="text-sm font-semibold" style={{ color: "#38240D" }}>{b.otherName}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(56,36,13,0.55)" }}>
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" style={{ color: "#C4783A" }} />
                        <span>{fmt(b.scheduled_start)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(56,36,13,0.45)" }}>
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>Hasta: {fmt(b.scheduled_end)}</span>
                      </div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: `${s.color}22`, color: s.color }}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
