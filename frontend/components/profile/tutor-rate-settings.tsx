"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatCOP } from "@/lib/currency";

export default function TutorRateSettings({ initial }: { initial?: number }) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate] = useState(initial ? String(initial) : "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    const value = Number(rate);
    if (!rate || Number.isNaN(value) || value <= 0) {
      toast.error("Ingresa una tarifa válida");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/tutors/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourly_rate: value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || "Error al actualizar la tarifa");
      }

      toast.success("Tarifa actualizada");
      setEditing(false);
      // Refresca la página para que se vea el nuevo valor en el resto de la vista
      window.location.reload();
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  if (!editing) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setEditing(true)}
        className="mt-2 border-border bg-white text-[#10314F] hover:bg-[#F8FBFF]"
      >
        Editar tarifa
      </Button>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <Label htmlFor="hourly-rate-edit">Nueva tarifa por hora (COP)</Label>
      <Input
        id="hourly-rate-edit"
        type="number"
        min="0"
        step="1000"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        placeholder="30000"
        className="h-9 w-full rounded-xl border-border bg-[#F8FBFF]"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={save}
          disabled={loading}
          size="sm"
          className="bg-[#CCFBF1] text-[#0F766E] hover:bg-[#B2F5EA] disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setEditing(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
      {rate && !Number.isNaN(Number(rate)) && Number(rate) > 0 && (
        <p className="text-xs text-muted-foreground">Vista previa: {formatCOP(Number(rate))}/hora</p>
      )}
    </div>
  );
}