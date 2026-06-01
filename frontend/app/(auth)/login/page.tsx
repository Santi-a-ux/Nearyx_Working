"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

import { loginAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border-input bg-muted pl-10 pr-4 shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="text-label text-primary">Bienvenido de vuelta</div>
      <h1 className="text-display-lg font-display mt-3 tracking-tight">Entra a tu cuenta.</h1>
      <p className="text-body mt-3 text-muted-foreground">Continúa donde lo dejaste y descubre quién está cerca.</p>

      <form action={formAction} className="mt-10 space-y-4">
        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">Correo electrónico</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            <Input name="email" type="email" placeholder="correo@ejemplo.com" required disabled={isPending} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label text-muted-foreground">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            <Input name="password" type="password" placeholder="••••••••" required disabled={isPending} className={inputClass} />
          </div>
        </div>

        {state?.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</div>
        ) : null}

        <Button type="submit" variant="brand" size="lg" disabled={isPending} className="mt-2 h-12 w-full gap-2">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">o</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Link
        href="/register"
        className={cn(
          "inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-[#EEF6FF] px-3 text-sm font-bold text-[#2563EB] transition-colors hover:bg-[#E0EFFF]"
        )}
      >
        Crear cuenta nueva
      </Link>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-[#2563EB] hover:underline">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}
