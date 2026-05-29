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
    <div className="flex min-h-screen" style={{ backgroundColor: '#38240D' }}>

      {/* ── Panel izquierdo ── */}
      <div className="relative hidden overflow-hidden p-12 lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
        {/* Fondos decorativos */}
        <div className="absolute inset-0 bg-linear-to-br from-[#C4783A]/30 via-[#38240D] to-[#A35F28]/20" />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#C4783A]/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-[#A35F28]/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 h-125 w-125 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C4783A]/5 blur-[100px] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-px bg-linear-to-b from-transparent via-[#C4783A]/20 to-transparent" />

        <div className="relative z-10 flex max-w-sm flex-col items-center text-center">

          {/* Logo imagen — reemplaza el bloque TM */}
          <div className="mb-6 flex items-center justify-center rounded-2xl border border-[#C4783A]/30 bg-[#FDFBD4]/10 p-4 backdrop-blur-sm shadow-xl shadow-[#C4783A]/10"
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
            style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4' }}
          >
            Nearyx
          </h1>
          <p
            className="mb-10 text-sm leading-relaxed"
            style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.70)' }}
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
                  fontFamily: 'var(--font-main)',
                  borderColor: 'rgba(253, 251, 212, 0.12)',
                  backgroundColor: 'rgba(253, 251, 212, 0.05)',
                }}
              >
                <span style={{ color: '#C4783A', flexShrink: 0 }}>
                  {feature.icon}
                </span>
                <span className="text-sm" style={{ color: 'rgba(253, 251, 212, 0.75)' }}>
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          {/* Testimonio */}
          <div
            className="mt-10 w-full rounded-2xl border p-4 text-left"
            style={{
              borderColor: 'rgba(253, 251, 212, 0.12)',
              backgroundColor: 'rgba(253, 251, 212, 0.05)',
            }}
          >
            <p
              className="text-xs leading-relaxed italic"
              style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.60)' }}
            >
              "Encontré mi tutor de cálculo en 5 minutos. Pasé el examen con 4.5."
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'rgba(196, 120, 58, 0.40)', color: '#FDFBD4' }}
              >
                M
              </div>
              <div>
                <p className="text-xs font-medium" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.70)' }}>
                  María R.
                </p>
                <p className="text-xs" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.40)' }}>
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
        style={{ backgroundColor: '#38240D' }}
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
              style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4' }}
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
