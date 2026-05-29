"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function TutorPaymentSettings({ initial }: { initial?: string }) {
  const [method, setMethod] = useState(initial || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tutors/profiles", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferred_payment_method: method }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.detail || "Error updating tutor settings");
      }

      toast.success("Preferencia de pago guardada");
    } catch (err) {
      const e = err as Error;
      toast.error(e.message || "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Metodo de pago preferido</Label>
      <div className="flex items-center gap-3">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="rounded border bg-transparent px-3 py-1 text-sm text-white/80"
        >
          <option value="" disabled>
            Selecciona un método
          </option>
          <option value="paypal">PayPal</option>
          <option value="bank_transfer">Transferencia bancaria</option>
          <option value="card">Tarjeta</option>
          <option value="cash">Efectivo</option>
        </select>
        <Button onClick={save} disabled={loading || !method} size="sm">
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
