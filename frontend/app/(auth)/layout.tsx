import type { ReactNode } from "react";
import { CalendarDays, MapPin, MessageCircle, Star } from "lucide-react";

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
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 lg:px-16">
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <img src="/nearyx-azul.svg" alt="Nearyx" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-semibold">Nearyx</span>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <div className="hidden items-center gap-3 lg:mb-10 lg:flex">
            <img src="/nearyx-azul.svg" alt="Nearyx" className="h-9 w-9 object-contain" />
            <span className="font-display text-lg font-semibold">Nearyx</span>
          </div>
          {children}
        </div>

        <p className="text-caption text-muted-foreground">© 2026 Nearyx</p>
      </div>

      <aside className="relative hidden overflow-hidden bg-foreground text-background lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-16">
          <div className="text-label opacity-70">Editorial · 01</div>
          <blockquote>
            <p className="font-display text-4xl font-medium italic leading-[1.15] tracking-tight">
              &ldquo;Aprender cerca de casa convirtió a mi barrio en un campus abierto.&rdquo;
            </p>
            <footer className="mt-8">
              <div className="text-h3">Marta L.</div>
              <div className="text-caption opacity-70">· Estudiante de Arquitectura · Medellín</div>
            </footer>
          </blockquote>
          <ul className="mt-12 space-y-3">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-body">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
          <div className="text-caption mt-12 opacity-70">Expertos verificados · Mapa y mensajes</div>
        </div>
      </aside>
    </div>
  );
}
