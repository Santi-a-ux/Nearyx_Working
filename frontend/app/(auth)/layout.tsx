import type { ReactNode } from "react";
import { MapPin, MessageCircle, BookOpen, Star } from "lucide-react";

const features = [
  { icon: <MapPin className="h-4 w-4" />, text: "Tutores cerca de ti en el mapa" },
  { icon: <MessageCircle className="h-4 w-4" />, text: "Chat en tiempo real" },
  { icon: <BookOpen className="h-4 w-4" />, text: "Matemáticas, idiomas, código y más" },
  { icon: <Star className="h-4 w-4" />, text: "Reseñas verificadas de estudiantes" },
];

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen bg-[var(--ui-dark-panel-bg)]" style={{ fontFamily: "var(--font-body)" }}>

      {/* ── Panel izquierdo ── */}
      <div className="relative hidden overflow-hidden p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        {/* Fondos decorativos */}
        <div className="absolute inset-0 bg-linear-to-br from-[#172554]/50 via-[#0f172a] to-[#0058ff]/26" />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#8ec5fc]/18 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#0058ff]/16 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#8ec5fc]/10 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-[#8ec5fc]/24 to-transparent" />

        <div className="relative z-10 flex max-w-sm flex-col items-center text-center">

          {/* Logo imagen — reemplaza el bloque TM */}
          <div className="mb-6 flex items-center justify-center rounded-2xl border border-[rgba(142,197,252,0.45)] bg-[rgba(248,251,255,0.12)] p-4 backdrop-blur-sm shadow-xl shadow-[rgba(0,88,255,0.24)]"
            style={{ width: '88px', height: '88px' }}>
            <img
              src="/nearyx-cafe.svg"
              alt="Nearyx"
              style={{
                width: '56px',
                height: '56px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(5deg)',
                // El SVG es café oscuro → lo convertimos a crema para que se vea sobre el fondo
              }}
            />
          </div>

          {/* Nombre de la app */}
          <h1
            className="mb-3 text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)', color: 'var(--ui-dark-panel-text)' }}
          >
            Nearyx
          </h1>
          <p
            className="mb-10 text-sm leading-relaxed"
            style={{ color: 'rgba(248,251,255,0.78)' }}
          >
            Aprende, resuelve y conecta con personas que pueden ayudarte
          </p>

          {/* Features con íconos Lucide */}
          <div className="w-full space-y-3 text-left">
            {features.map((feature) => (
              <div
                key={feature.text}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-sm"
                style={{
                  borderColor: 'rgba(148,163,184,0.30)',
                  backgroundColor: 'rgba(148,163,184,0.12)',
                }}
              >
                <span style={{ color: '#8ec5fc', flexShrink: 0 }}>
                  {feature.icon}
                </span>
                <span className="text-sm" style={{ color: 'rgba(248,251,255,0.82)' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Testimonio */}
          <div
            className="mt-10 w-full rounded-2xl border p-4 text-left"
            style={{
              borderColor: 'rgba(148,163,184,0.30)',
              backgroundColor: 'rgba(148,163,184,0.12)',
            }}
          >
            <p
              className="text-xs leading-relaxed italic"
              style={{ color: 'rgba(248,251,255,0.72)' }}
            >
              "Encontré mi tutor de cálculo en 5 minutos. Pasé el examen con 4.5."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(0,88,255,0.4)', color: '#f8fbff' }}
              >
                M
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: 'rgba(248,251,255,0.8)' }}>
                  María R.
                </p>
                <p className="text-xs" style={{ color: 'rgba(248,251,255,0.56)' }}>
                  Estudiante de Ingeniería
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ── */}
      <div
        className="relative flex w-full items-center justify-center p-6 lg:w-1/2"
        style={{ backgroundColor: 'var(--ui-dark-panel-bg)' }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm">

          {/* Logo móvil */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <img
              src="/nearyx-cafe.svg"
              alt="Nearyx"
              style={{
                width: '32px',
                height: '32px',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
              }}
            />
            <span
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--ui-dark-panel-text)' }}
            >
              Nearyx
            </span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
