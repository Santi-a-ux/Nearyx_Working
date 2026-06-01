import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, MessageCircle, Users } from "lucide-react";

import { appCardInnerClass } from "@/lib/surface-styles";

const highlights = [
  {
    icon: MapPin,
    title: "Expertos en el mapa",
    desc: "Ve quién está cerca y disponible para ayudarte.",
  },
  {
    icon: MessageCircle,
    title: "Chat directo",
    desc: "Coordina sesiones sin salir de la plataforma.",
  },
  {
    icon: Users,
    title: "Comunidad activa",
    desc: "Publica en el feed y conecta con quien resuelve tu necesidad.",
  },
] as const;

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (token) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#10314F]">
      <nav className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-[#F8FBFF]/95 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img src="/nearyx-azul.svg" alt="Nearyx" className="h-8 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight">Nearyx</span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-[#2563EB]">
            Iniciar sesión
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-[#95C9FC] px-4 py-2 text-sm font-bold text-[#10314F] shadow-sm transition-colors hover:bg-[#7FB8F5]"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      <main className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#EEF6FF_0%,#F8FBFF_60%,#ffffff_100%)]" />

        <h1 className="relative z-10 mb-5 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
          El experto que necesitas,
          <span className="text-[#2563EB]"> cerca de ti</span>
        </h1>

        <p className="relative z-10 mb-10 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Encuentra ayuda en matemáticas, idiomas, programación y más. Mapa, mensajes y reservas en un solo lugar.
        </p>

        <div className="relative z-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/register"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#95C9FC] px-8 text-sm font-bold text-[#10314F] shadow-sm transition-colors hover:bg-[#7FB8F5]"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-8 text-sm font-semibold text-[#10314F] transition-colors hover:bg-[#EEF6FF]"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="relative z-10 mt-20 grid w-full max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          {highlights.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={`${appCardInnerClass} bg-white text-left`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF6FF] text-[#2563EB]">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted-foreground">
        Nearyx · Medellín, Colombia
      </footer>
    </div>
  );
}
