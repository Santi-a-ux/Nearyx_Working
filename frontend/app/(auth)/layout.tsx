import type { ReactNode } from "react";
import { CalendarDays, MapPin, MessageCircle, Star } from "lucide-react";

import { appCardInnerClass } from "@/lib/surface-styles";

const features = [
  { icon: MapPin, text: "Expertos cerca de ti en el mapa" },
  { icon: MessageCircle, text: "Chat en tiempo real" },
  { icon: CalendarDays, text: "Reservas y sesiones organizadas" },
  { icon: Star, text: "Reseñas de la comunidad" },
] as const;

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[#F8FBFF]">
      <div className="relative hidden overflow-hidden border-r border-border bg-[linear-gradient(180deg,#EEF6FF_0%,#F8FBFF_100%)] p-10 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[#95C9FC]/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-[#C6E2FE]/40 blur-3xl" />

        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border bg-white p-3 shadow-sm">
            <img src="/nearyx-azul.svg" alt="Nearyx" className="h-12 w-12 object-contain" />
          </div>

          <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#10314F]">Nearyx</h1>
          <p className="mb-10 text-sm leading-relaxed text-muted-foreground">
            Aprende, resuelve dudas y conecta con expertos que pueden ayudarte hoy.
          </p>

          <div className="w-full space-y-3 text-left">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className={`flex items-center gap-3 ${appCardInnerClass} py-3`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#95C9FC] text-[#10314F]">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[#10314F]">{text}</span>
              </div>
            ))}
          </div>

          <div className={`mt-10 w-full text-left ${appCardInnerClass}`}>
            <p className="text-xs italic leading-relaxed text-muted-foreground">
              &ldquo;Encontré mi experto de cálculo en minutos. Pasé el examen con 4.5.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#95C9FC] text-xs font-semibold text-[#10314F]">
                M
              </div>
              <div>
                <p className="text-xs font-semibold text-[#10314F]">María R.</p>
                <p className="text-xs text-muted-foreground">Estudiante de ingeniería</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img src="/nearyx-azul.svg" alt="Nearyx" className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-[#10314F]">Nearyx</span>
          </div>

          <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
