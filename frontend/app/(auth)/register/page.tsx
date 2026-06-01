"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, GraduationCap, Loader2, Lock, Mail, User } from "lucide-react";
import { toast } from "sonner";

import { registerAction } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const inputClass =
  "h-12 rounded-xl border-border bg-[#F8FBFF] pl-10 pr-4 text-[#10314F] shadow-sm placeholder:text-muted-foreground focus-visible:border-[#95C9FC] focus-visible:ring-2 focus-visible:ring-[#C6E2FE]/50";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerAction, null);
  const [role, setRole] = useState<"student" | "tutor">("student");

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-[#10314F]">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">Únete a estudiantes y expertos en Medellín</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Nombre completo</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2563EB]" />
            <Input name="fullName" type="text" placeholder="Juan Pérez" required disabled={isPending} className={inputClass} />
          </div>
        </div>

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
            <Input name="password" type="password" placeholder="Mínimo 8 caracteres" required disabled={isPending} className={inputClass} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Quiero ser...</label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={() => setRole("student")}
              variant="outline"
              className={cn(
                "flex h-auto flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-sm font-bold",
                role === "student"
                  ? "border-[#95C9FC] bg-[#95C9FC] text-[#10314F] hover:bg-[#7FB8F5]"
                  : "border-border bg-white text-[#10314F] hover:bg-[#F8FBFF]"
              )}
            >
              <GraduationCap className="h-5 w-5" />
              <span>Estudiante</span>
            </Button>
            <Button
              type="button"
              onClick={() => setRole("tutor")}
              variant="outline"
              className={cn(
                "flex h-auto flex-col items-center gap-2 rounded-xl border px-3 py-3.5 text-sm font-bold",
                role === "tutor"
                  ? "border-[#95C9FC] bg-[#95C9FC] text-[#10314F] hover:bg-[#7FB8F5]"
                  : "border-border bg-white text-[#10314F] hover:bg-[#F8FBFF]"
              )}
            >
              <Briefcase className="h-5 w-5" />
              <span>Experto</span>
            </Button>
          </div>
          <input type="hidden" name="role" value={role} />
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
          {isPending ? "Creando cuenta..." : "Crear cuenta gratis"}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-bold text-[#2563EB] hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
