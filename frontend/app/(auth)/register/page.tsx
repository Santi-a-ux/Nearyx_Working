"use client";

import { useActionState, useEffect, useState } from "react";
import { registerAction } from "@/lib/auth";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
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
    <div style={{ fontFamily: 'var(--font-main)' }}>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4' }}>Crea tu cuenta</h1>
        <p className="text-sm" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.60)' }}>Únete a estudiantes y tutores de Medellín</p>
      </div>

      <form action={formAction} className="space-y-4" style={{ fontFamily: 'var(--font-main)' }}>
        <div className="space-y-1.5">
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Nombre completo</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
              <IconProfile className="h-4 w-4" />
            </div>
            <input
              name="fullName"
              type="text"
              placeholder="Juan Pérez"
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
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Contraseña</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
              <IconLock className="h-4 w-4" />
            </div>
            <input
              name="password"
              type="password"
              placeholder="Mínimo 8 caracteres"
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
          <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Quiero ser...</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className="flex flex-col items-center gap-1 rounded-xl border p-3.5 text-sm font-medium transition-all"
              style={{ 
                borderColor: role === "student" ? '#C4783A' : 'rgba(253, 251, 212, 0.25)',
                backgroundColor: role === "student" ? 'rgba(196, 120, 58, 0.20)' : 'rgba(253, 251, 212, 0.08)',
                color: role === "student" ? '#FDFBD4' : 'rgba(253, 251, 212, 0.50)',
                boxShadow: role === "student" ? 'rgba(196, 120, 58, 0.20) 0 4px 12px' : 'none'
              }}
            >
              <span className="text-xl">🎓</span>
              <span>Estudiante</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("tutor")}
              className="flex flex-col items-center gap-1 rounded-xl border p-3.5 text-sm font-medium transition-all"
              style={{ 
                borderColor: role === "tutor" ? '#C4783A' : 'rgba(253, 251, 212, 0.25)',
                backgroundColor: role === "tutor" ? 'rgba(196, 120, 58, 0.20)' : 'rgba(253, 251, 212, 0.08)',
                color: role === "tutor" ? '#FDFBD4' : 'rgba(253, 251, 212, 0.50)',
                boxShadow: role === "tutor" ? 'rgba(196, 120, 58, 0.20) 0 4px 12px' : 'none'
              }}
            >
              <span className="text-xl">📚</span>
              <span>Tutor</span>
            </button>
          </div>
          <input type="hidden" name="role" value={role} />
        </div>

        {state?.error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">{state.error}</div>}

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
          {isPending ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs" style={{ color: 'rgba(253, 251, 212, 0.30)' }}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium transition-colors" style={{ color: '#C4783A' }}>
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}