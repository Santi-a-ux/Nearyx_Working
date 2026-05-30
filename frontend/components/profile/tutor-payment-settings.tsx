"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const METHODS = [
  { value: "paypal", label: "PayPal" },
  { value: "bank_transfer", label: "Transferencia" },
  { value: "card", label: "Tarjeta" },
  { value: "cash", label: "Efectivo" },
] as const;

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
      <div className="flex flex-wrap items-center gap-2">
        {METHODS.map((item) => (
          <Button
            key={item.value}
            type="button"
            variant={method === item.value ? "default" : "outline"}
            size="sm"
            onClick={() => setMethod(item.value)}
          >
            {item.label}
          </Button>
        ))}
        <Button onClick={save} disabled={loading || !method} size="sm">
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
