"use client";

import { useActionState, useEffect, useState } from "react";
import { registerAction } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconProfile, IconMail, IconLock } from "@/components/icons/TmIcons";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [role, setRole] = useState<'student' | 'tutor'>('student');

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div style={{ fontFamily: "var(--font-body)" }}>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[var(--ui-dark-panel-text)]" style={{ fontFamily: "var(--font-heading)" }}>
          Crea tu cuenta
        </h1>
        <p className="text-sm text-[rgba(248,251,255,0.72)]">Únete a estudiantes y tutores de Medellín</p>
      </div>

      <form action={formAction} className="space-y-4" style={{ fontFamily: "var(--font-body)" }}>
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-[rgba(248,251,255,0.72)]">Nombre completo</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(248,251,255,0.42)]">
              <IconProfile className="h-4 w-4" />
            </div>
            <Input
              name="fullName"
              type="text"
              placeholder="Juan Pérez"
              required
              disabled={isPending}
              className="h-12 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] pl-10 pr-4 text-sm text-(--ui-dark-panel-text) shadow-none outline-none transition-all placeholder:text-[rgba(248,251,255,0.55)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,88,255,0.18)] disabled:opacity-50"
            />
          </div>
        </div>

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
              className="h-12 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] pl-10 pr-4 text-sm text-(--ui-dark-panel-text) shadow-none outline-none transition-all placeholder:text-[rgba(248,251,255,0.55)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,88,255,0.18)] disabled:opacity-50"
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
              placeholder="Mínimo 8 caracteres"
              required
              disabled={isPending}
              className="h-12 rounded-xl border border-[rgba(148,163,184,0.35)] bg-[rgba(148,163,184,0.10)] pl-10 pr-4 text-sm text-(--ui-dark-panel-text) shadow-none outline-none transition-all placeholder:text-[rgba(248,251,255,0.55)] focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,88,255,0.18)] disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-[rgba(248,251,255,0.72)]">Quiero ser...</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => setRole("student")}
              variant={role === "student" ? "default" : "outline"}
              className="flex h-auto flex-col items-center gap-1 rounded-xl px-3.5 py-3.5 text-sm font-bold text-[rgba(248,251,255,0.92)]"
            >
              <span className="text-xl">🎓</span>
              <span>Estudiante</span>
            </Button>
            <Button
              type="button"
              onClick={() => setRole("tutor")}
              variant={role === "tutor" ? "default" : "outline"}
              className="flex h-auto flex-col items-center gap-1 rounded-xl px-3.5 py-3.5 text-sm font-bold text-[rgba(248,251,255,0.92)]"
            >
              <span className="text-xl">📚</span>
              <span>Tutor</span>
            </Button>
          </div>
          <input type="hidden" name="role" value={role} />
        </div>

        {state?.error && <div className="rounded-xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-xs text-red-300">{state.error}</div>}

        <Button
          type="submit"
          disabled={isPending}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-[var(--primary-foreground)] shadow-[0_10px_22px_rgba(0,88,255,0.35)] transition-all hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Creando cuenta..." : "Crear cuenta gratis"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-[rgba(248,251,255,0.62)]">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-[var(--brand-soft)] transition-colors hover:text-[var(--primary)]">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}