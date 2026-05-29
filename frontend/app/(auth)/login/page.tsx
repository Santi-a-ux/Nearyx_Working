"use client";

import { useActionState, useEffect } from "react";
import { loginAction } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { IconMail, IconLock } from "@/components/icons/TmIcons";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div style={{ fontFamily: 'var(--font-main)' }}>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4' }}>Bienvenido de vuelta</h1>
        <p className="text-sm" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.60)' }}>Ingresa tus datos para continuar</p>
      </div>

      <form action={formAction} className="space-y-4" style={{ fontFamily: 'var(--font-main)' }}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Correo electrónico</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
              <IconMail className="h-4 w-4" />
            </div>
            <input
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              required
              disabled={isPending}
              className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all disabled:opacity-50"
              style={{ 
                borderColor: 'rgba(253, 251, 212, 0.25)',
                backgroundColor: 'rgba(253, 251, 212, 0.08)',
                color: '#FDFBD4',
                border: '1px solid'
              }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Contraseña</label>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
              <IconLock className="h-4 w-4" />
            </div>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
              className="w-full rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all disabled:opacity-50"
              style={{ 
                borderColor: 'rgba(253, 251, 212, 0.25)',
                backgroundColor: 'rgba(253, 251, 212, 0.08)',
                color: '#FDFBD4',
                border: '1px solid'
              }}
            />
          </div>
        </div>

        {state?.error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold shadow-lg transition-all disabled:cursor-not-allowed disabled:opacity-50"
          style={{ 
            backgroundColor: '#C4783A',
            color: '#FDFBD4',
            boxShadow: 'rgba(196, 120, 58, 0.30) 0 8px 16px'
          }}
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(253, 251, 212, 0.25)' }} />
        <span className="text-xs" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>o</span>
        <div className="h-px flex-1" style={{ backgroundColor: 'rgba(253, 251, 212, 0.25)' }} />
      </div>

      <Link
        href="/register"
        className="inline-flex h-12 w-full items-center justify-center rounded-xl px-3 text-sm font-medium transition-all"
        style={{ 
          borderColor: 'rgba(253, 251, 212, 0.25)',
          backgroundColor: 'rgba(253, 251, 212, 0.08)',
          color: 'rgba(253, 251, 212, 0.70)',
          border: '1px solid'
        }}
      >
        Crear cuenta nueva
      </Link>

      <p className="mt-6 text-center text-xs" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium transition-colors" style={{ color: '#C4783A' }}>
          Regístrate gratis
        </Link>
      </p>
    </div>
  );
}