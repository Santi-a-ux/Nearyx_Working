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
  "h-12 rounded-xl border-border bg-[#F8FBFF] pl-10 pr-4 text-[#10314F] shadow-sm placeholder:text-muted-foreground focus-visible:border-[#95C9FC] focus-visible:ring-2 focus-visible:ring-[#C6E2FE]/50";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-[#10314F]">Bienvenido de vuelta</h1>
        <p className="text-sm text-muted-foreground">Ingresa tus datos para continuar</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Correo electrónico</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            <Input name="email" type="email" placeholder="correo@ejemplo.com" required disabled={isPending} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Contraseña</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            <Input name="password" type="password" placeholder="••••••••" required disabled={isPending} className={inputClass} />
          </div>
        </div>

        {state?.error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{state.error}</div>
        ) : null}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#95C9FC] text-sm font-bold text-[#10314F] hover:bg-[#7FB8F5]"
        >
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
