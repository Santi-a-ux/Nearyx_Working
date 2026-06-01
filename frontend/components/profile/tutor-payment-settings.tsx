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
        throw new Error(data.error || data.detail || "Error al actualizar la configuración del experto");
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
            variant="outline"
            size="sm"
            className={
              method === item.value
                ? "border-[#95C9FC] bg-[#95C9FC] text-[#10314F] hover:bg-[#7FB8F5] hover:text-[#10314F]"
                : "border-border bg-white text-[#10314F] hover:bg-[#F8FBFF]"
            }
            onClick={() => setMethod(item.value)}
          >
            {item.label}
          </Button>
        ))}
        <Button
          onClick={save}
          disabled={loading || !method}
          size="sm"
          className="bg-[#CCFBF1] text-[#0F766E] hover:bg-[#B2F5EA] disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </div>
  );
}
