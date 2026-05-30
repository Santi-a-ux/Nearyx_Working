"use client";

import { useActionState, useEffect } from "react";
import { loginAction } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconMail, IconLock } from "@/components/icons/TmIcons";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--ui-dark-panel-text)]" style={{ fontFamily: "var(--font-heading)" }}>
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-[rgba(248,251,255,0.72)]">Ingresa tus datos para continuar</p>
      </div>

      <form action={formAction} className="space-y-4" style={{ fontFamily: "var(--font-body)" }}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-[rgba(248,251,255,0.72)]">Correo electrónico</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,251,255,0.42)]">
              <IconMail className="h-4 w-4" />
            </div>
            <Input
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              disabled={isPending}
              className="h-12 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] pl-10 pr-4 text-sm text-[var(--ui-dark-panel-text)] shadow-none outline-none transition-all placeholder:text-[rgba(248,251,255,0.55)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(0,88,255,0.18)] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-[rgba(248,251,255,0.72)]">Contraseña</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,251,255,0.42)]">
              <IconLock className="h-4 w-4" />
            </div>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              className="h-12 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] pl-10 pr-4 text-sm text-[var(--ui-dark-panel-text)] shadow-none outline-none transition-all placeholder:text-[rgba(248,251,255,0.55)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(0,88,255,0.18)] disabled:opacity-50"
            />
          </div>
        </div>

        {state?.error && <div className="rounded-xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-xs text-red-300">{state.error}</div>}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] shadow-[0_10px_22px_rgba(0,88,255,0.35)] transition-all hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(148,163,184,0.35)]" />
        <span className="text-xs text-[rgba(248,251,255,0.55)]">o</span>
        <div className="h-px flex-1 bg-[rgba(148,163,184,0.35)]" />
      </div>

      <Link
        href="/register"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] px-3 text-sm font-bold text-[rgba(248,251,255,0.9)] transition-all hover:border-[rgba(96,165,250,0.7)] hover:bg-[rgba(96,165,250,0.12)]"
      >
        Crear cuenta nueva
      </Link>

      <p className="mt-6 text-center text-xs text-[rgba(248,251,255,0.62)]">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-bold text-[var(--brand-soft)] transition-colors hover:text-[var(--primary)]">
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}