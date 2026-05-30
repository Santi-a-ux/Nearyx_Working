"use client";

import { useState } from "react";
import { CalendarDays, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BookingModalProps {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ studentId, studentName, onClose, onSuccess }: BookingModalProps) {
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const localDateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!date) { toast.error("Selecciona una fecha"); return; }
    if (endTime <= startTime) { toast.error("La hora de fin debe ser posterior a la de inicio"); return; }

    setSaving(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: studentId,
          scheduled_start: `${date}T${startTime}:00`,
          scheduled_end: `${date}T${endTime}:00`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "No se pudo crear la reserva");
      toast.success("Reserva creada correctamente");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ backgroundColor: "var(--color-surface)", borderColor: "rgba(253,251,212,0.15)" }}>
        <button onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-[rgba(253,251,212,0.5)] hover:text-[rgba(253,251,212,0.9)]">
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5">
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-bg)" }}>Nueva reserva</h2>
          <p className="mt-1 text-sm" style={{ color: "rgba(253,251,212,0.55)" }}>
            Estudiante: <span style={{ color: "rgba(253,251,212,0.85)" }}>{studentName}</span>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(253,251,212,0.7)" }}>
              <CalendarDays className="h-4 w-4" /> Fecha
            </label>
            <input type="date" min={localDateStr} value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
              style={{ backgroundColor: "rgba(253,251,212,0.06)", borderColor: "rgba(253,251,212,0.15)", color: "var(--color-bg)", colorScheme: "dark" }} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(253,251,212,0.7)" }}>
                <Clock className="h-4 w-4" /> Inicio
              </label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "rgba(253,251,212,0.06)", borderColor: "rgba(253,251,212,0.15)", color: "var(--color-bg)", colorScheme: "dark" }} />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium" style={{ color: "rgba(253,251,212,0.7)" }}>
                <Clock className="h-4 w-4" /> Fin
              </label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: "rgba(253,251,212,0.06)", borderColor: "rgba(253,251,212,0.15)", color: "var(--color-bg)", colorScheme: "dark" }} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}
            style={{ borderColor: "rgba(253,251,212,0.15)", color: "rgba(253,251,212,0.7)" }}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={handleSubmit} disabled={saving}
            style={{ backgroundColor: "#C4783A", color: "var(--color-bg)" }}>
            {saving ? "Guardando..." : "Confirmar reserva"}
          </Button>
        </div>
      </div>
    </div>
  );
}
