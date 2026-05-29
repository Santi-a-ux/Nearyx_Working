import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, MessageCircle, BookOpen, Star, Search, Zap, Bell } from 'lucide-react';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (token) redirect('/dashboard');

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ backgroundColor: '#FDFBD4', color: '#38240D', fontFamily: 'var(--font-main)' }}>

      {/* ── NAVBAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-0 backdrop-blur-md border-b" style={{ backgroundColor: '#38240D', borderColor: 'rgba(253,251,212,0.08)', height: '58px' }}>

        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <img
            src="/nearyx-cafe.svg"
            alt="Nearyx"
            style={{
              width: '28px',
              height: '28px',
              objectFit: 'contain',
              filter: 'brightness(0) invert(1) sepia(1) saturate(1.5) hue-rotate(5deg)',
            }}
          />
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4' }}>
            Nearyx
          </span>
        </div>

        {/* Links centrales — sin "Tutores" */}
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'rgba(253,251,212,0.75)' }}>
          <a href="#features" className="hover:text-[#FDFBD4] transition-colors" style={{ fontFamily: 'var(--font-main)' }}>
            Características
          </a>
          <a href="#how" className="hover:text-[#FDFBD4] transition-colors" style={{ fontFamily: 'var(--font-main)' }}>
            Cómo funciona
          </a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm transition-colors px-3 py-1.5" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253,251,212,0.75)' }}>
            Iniciar sesión
          </Link>
          <Link href="/register" className="text-sm transition-colors px-4 py-2 rounded-lg font-medium shadow-lg" style={{ fontFamily: 'var(--font-main)', backgroundColor: '#C4783A', color: '#FDFBD4' }}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center overflow-hidden" style={{ backgroundColor: '#38240D' }}>

        {/* Sin badge del punto verde */}

        {/* Título principal — redactado para reflejar la app correctamente */}
        <h1 className="relative z-10 text-5xl md:text-7xl font-bold leading-tight max-w-4xl mb-6 tracking-tight" style={{ fontFamily: 'var(--font-main)', color: '#FDFBD4', fontWeight: 700 }}>
          Conecta con el experto
          <br />
          <span style={{ color: '#C4783A' }}>
            que necesitas hoy
          </span>
        </h1>

        <p className="relative z-10 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed" style={{ fontFamily: 'var(--font-main)', color: 'rgba(253, 251, 212, 0.75)' }}>
          Encuentra profesionales en matemáticas, idiomas, programación, diseño y más.
          Que te enseñen, te asesoren o simplemente resuelvan lo que necesitas —
          tú decides cómo quieres trabajar con ellos.
        </p>

        {/* CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-4">
          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            className="w-full sm:flex-1 rounded-xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              backgroundColor: 'rgba(253,251,212,0.08)',
              border: '1px solid rgba(253,251,212,0.15)',
              color: '#FDFBD4',
            }}
          />
          <Link
            href="/register"
            className="w-full sm:w-auto shrink-0 font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#C4783A', color: '#FDFBD4' }}
          >
            Comenzar gratis
          </Link>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'rgba(253, 251, 212, 0.45)' }}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="hover:underline" style={{ color: '#C4783A' }}>
            Inicia sesión
          </Link>
        </p>

        {/* Preview dashboard */}
        <div className="relative z-10 mt-16 w-full max-w-5xl">
          <div className="rounded-2xl border overflow-hidden shadow-2xl shadow-black/50" style={{ borderColor: 'rgba(253,251,212,0.08)', backgroundColor: 'rgba(253,251,212,0.03)' }}>

            {/* Barra browser */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: 'rgba(253,251,212,0.03)', borderColor: 'rgba(253,251,212,0.06)' }}>
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="rounded-md px-3 py-1 text-xs flex items-center gap-2 w-48" style={{ backgroundColor: 'rgba(253,251,212,0.04)', border: '1px solid rgba(253,251,212,0.08)', color: 'rgba(253,251,212,0.25)' }}>
                  <span className="h-2 w-2 rounded-full bg-green-400/60" />
                  nearyx.app/dashboard
                </div>
              </div>
            </div>

            {/* Contenido preview */}
            <div className="p-4 min-h-70 flex gap-4" style={{ backgroundColor: '#1a0f05' }}>

              {/* Sidebar simulado */}
              <div className="w-12 flex flex-col items-center gap-4 py-2">
                {['🏠', '🗺️', '💬', '👤'].map((icon, i) => (
                  <div key={i} className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm ${i === 0 ? 'bg-[#C4783A]/20' : ''}`} style={{ color: i === 0 ? '#C4783A' : 'rgba(253,251,212,0.20)' }}>
                    {icon}
                  </div>
                ))}
              </div>

              {/* Feed simulado */}
              <div className="flex-1 space-y-3">
                {[
                  { name: 'Carlos M.', time: '2m', text: '¿Alguien que me ayude con cálculo diferencial? Tengo examen el viernes 📐', likes: 4 },
                  { name: 'Ana García', time: '15m', text: 'Experta en Python disponible este fin de semana. Te enseño o lo resuelvo por ti. ¡Primeras 2h con descuento! 🐍', likes: 12 },
                ].map((post, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(253,251,212,0.03)', border: '1px solid rgba(253,251,212,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'rgba(196,120,58,0.30)', color: '#FDFBD4' }}>
                        {post.name[0]}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'rgba(253,251,212,0.70)' }}>{post.name}</span>
                      <span className="text-xs" style={{ color: 'rgba(253,251,212,0.25)' }}>· {post.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(253,251,212,0.50)' }}>{post.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'rgba(253,251,212,0.25)' }}>
                      <span>❤️ {post.likes}</span>
                      <span>💬 Comentar</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar derecho simulado */}
              <div className="hidden md:block w-44 space-y-2">
                <p className="text-xs font-medium mb-3" style={{ color: 'rgba(253,251,212,0.35)' }}>Expertos cerca</p>
                {['Julia R.', 'Marco A.', 'Sofia L.'].map((name, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(253,251,212,0.03)' }}>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: 'rgba(196,120,58,0.25)', color: '#FDFBD4' }}>
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: 'rgba(253,251,212,0.60)' }}>{name}</p>
                      <div className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Glow */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(196,120,58,0.15)' }} />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative py-32 px-6 max-w-6xl mx-auto">

        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#C4783A', fontFamily: 'var(--font-main)' }}>
            Por qué Nearyx
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: '#38240D', fontFamily: 'var(--font-main)', fontWeight: 700 }}>
            Todo lo que necesitas
            <br />
            para resolver o aprender
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
            Una plataforma construida para conectar personas con expertos que pueden enseñarte, asesorarte o trabajar directamente para ti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <MapPin className="h-7 w-7" />,
              iconColor: '#7C3AED',
              borderColor: 'rgba(124,58,237,0.20)',
              title: 'Mapa interactivo',
              desc: 'Encuentra expertos disponibles ahora mismo cerca de tu ubicación. Radio de búsqueda inteligente que se expande automáticamente.',
            },
            {
              icon: <MessageCircle className="h-7 w-7" />,
              iconColor: '#2563EB',
              borderColor: 'rgba(37,99,235,0.20)',
              title: 'Chat en tiempo real',
              desc: 'Habla directamente con el experto. Sin intermediarios, sin esperas. Mensajería instantánea con WebSockets.',
            },
            {
              icon: <BookOpen className="h-7 w-7" />,
              iconColor: '#059669',
              borderColor: 'rgba(5,150,105,0.20)',
              title: 'Feed de la comunidad',
              desc: 'Comparte avances, busca expertos y conecta con otros usuarios. Una red social enfocada en resultados reales.',
            },
            {
              icon: <Star className="h-7 w-7" />,
              iconColor: '#D97706',
              borderColor: 'rgba(217,119,6,0.20)',
              title: 'Perfiles verificados',
              desc: 'Cada experto tiene un perfil completo con especialidades, experiencia y disponibilidad en tiempo real.',
            },
            {
              icon: <Search className="h-7 w-7" />,
              iconColor: '#DB2777',
              borderColor: 'rgba(219,39,119,0.20)',
              title: 'Búsqueda por área',
              desc: 'Filtra por la materia o servicio que necesitas y el mapa muestra solo los expertos disponibles en tu zona.',
            },
            {
              icon: <Bell className="h-7 w-7" />,
              iconColor: '#C4783A',
              borderColor: 'rgba(196,120,58,0.20)',
              title: 'Notificaciones al instante',
              desc: 'Recibe alertas cuando un experto responde, cuando hay uno disponible cerca o cuando alguien interactúa con tu publicación.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="relative p-6 rounded-2xl border hover:shadow-lg transition-all group cursor-default"
              style={{ borderColor: f.borderColor, backgroundColor: 'rgba(56,36,13,0.04)' }}
            >
              <div className="relative z-10">
                <div className="mb-4" style={{ color: f.iconColor }}>{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-24 px-6 border-t" style={{ borderColor: 'rgba(56,36,13,0.12)' }}>
        <div className="max-w-4xl mx-auto text-center">

          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: '#C4783A', fontFamily: 'var(--font-main)' }}>
            Cómo funciona
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-16" style={{ color: '#38240D', fontFamily: 'var(--font-main)', fontWeight: 700 }}>
            En 3 pasos simples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(196,120,58,0.40), transparent)' }} />

            {[
              {
                step: '01',
                icon: <BookOpen className="h-7 w-7" />,
                title: 'Crea tu cuenta',
                desc: 'Regístrate como cliente o experto en menos de 1 minuto.',
              },
              {
                step: '02',
                icon: <Search className="h-7 w-7" />,
                title: 'Encuentra tu experto',
                desc: 'Escribe lo que necesitas y el mapa te muestra expertos disponibles cerca de ti.',
              },
              {
                step: '03',
                icon: <Zap className="h-7 w-7" />,
                title: 'Trabaja a tu manera',
                desc: 'Que te lo enseñen, te asesoren o lo hagan por ti — tú decides cómo quieres trabajar.',
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-16 w-16 rounded-2xl border flex items-center justify-center shadow-lg" style={{ backgroundColor: 'rgba(196,120,58,0.08)', borderColor: 'rgba(196,120,58,0.20)', color: '#C4783A' }}>
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#C4783A', color: '#FDFBD4' }}>
                    {s.step[1]}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-6">
        <div className="relative max-w-3xl mx-auto text-center rounded-3xl border p-12 overflow-hidden" style={{ borderColor: 'rgba(196,120,58,0.20)', backgroundColor: 'rgba(196,120,58,0.05)' }}>

          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(196,120,58,0.08), transparent)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(196,120,58,0.15)' }} />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: '#38240D', fontFamily: 'var(--font-main)', fontWeight: 700 }}>
              Empieza hoy mismo
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
              Únete a usuarios y expertos que ya están conectando en Nearyx.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm" style={{ backgroundColor: '#C4783A', color: '#FDFBD4', boxShadow: 'rgba(196, 120, 58, 0.40) 0 8px 16px' }}>
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="font-medium px-8 py-3.5 rounded-xl transition-all text-sm border" style={{ borderColor: 'rgba(56, 36, 13, 0.20)', backgroundColor: 'rgba(56, 36, 13, 0.06)', color: '#38240D' }}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t py-8 px-6" style={{ borderColor: 'rgba(56, 36, 13, 0.15)', backgroundColor: '#FDFBD4' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/nearyx-cafe.svg"
              alt="Nearyx"
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
            <span className="text-sm font-semibold" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>
              Nearyx
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: 'rgba(56, 36, 13, 0.40)', fontFamily: 'var(--font-main)' }}>
            Medellín, Colombia · 2025
          </p>
          <div className="flex gap-6 text-xs" style={{ color: 'rgba(56, 36, 13, 0.55)' }}>
            <Link href="/login" className="hover:underline transition-colors" style={{ fontFamily: 'var(--font-main)' }}>Iniciar sesión</Link>
            <Link href="/register" className="hover:underline transition-colors" style={{ fontFamily: 'var(--font-main)' }}>Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
