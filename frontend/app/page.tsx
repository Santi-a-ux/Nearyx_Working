import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MapPin, MessageCircle, BookOpen, Star, Search, Zap, Bell } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (token) redirect('/dashboard');

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>

      {/* â”€â”€ NAVBAR â”€â”€ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-0 backdrop-blur-md border-b" style={{ backgroundColor: 'var(--ui-navbar-bg)', borderColor: 'var(--neutral-200)', height: '58px' }}>

        {/* Logo + nombre */}
        <div className="flex items-center gap-3">
          <img
            src="/nearyx-cafe.svg"
            alt="Nearyx"
            style={{
              width: '28px',
              height: '28px',
              objectFit: 'contain',
              filter: 'none',
            }}
          />
          <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)' }}>
            Nearyx
          </span>
        </div>

        {/* Links centrales â€” sin "Tutores" */}
        <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--neutral-700)' }}>
          <a href="#features" className="transition-colors hover:text-[var(--brand-hover)]" style={{ fontFamily: 'var(--font-body)' }}>
            CaracterÃ­sticas
          </a>
          <a href="#how" className="transition-colors hover:text-[var(--brand-hover)]" style={{ fontFamily: 'var(--font-body)' }}>
            CÃ³mo funciona
          </a>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm transition-colors px-3 py-1.5" style={{ fontFamily: 'var(--font-body)', color: 'var(--neutral-700)' }}>
            Iniciar sesiÃ³n
          </Link>
          <Link href="/register" className="text-sm transition-colors px-4 py-2 rounded-lg font-bold shadow-lg" style={{ fontFamily: 'var(--font-body)', backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* â”€â”€ HERO â”€â”€ */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center overflow-hidden" style={{ background: 'var(--ui-hero-bg)' }}>

        {/* Sin badge del punto verde */}

        {/* TÃ­tulo principal â€” redactado para reflejar la app correctamente */}
        <h1 className="relative z-10 text-5xl md:text-7xl font-bold leading-tight max-w-4xl mb-6 tracking-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--foreground)', fontWeight: 500 }}>
          Conecta con el experto
          <br />
          <span style={{ color: 'var(--primary)' }}>
            que necesitas hoy
          </span>
        </h1>

        <p className="relative z-10 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed" style={{ fontFamily: 'var(--font-body)', color: 'var(--neutral-700)' }}>
          Encuentra profesionales en matemÃ¡ticas, idiomas, programaciÃ³n, diseÃ±o y mÃ¡s.
          Que te enseÃ±en, te asesoren o simplemente resuelvan lo que necesitas â€”
          tÃº decides cÃ³mo quieres trabajar con ellos.
        </p>

        {/* CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mb-4">
          <Input
            type="email"
            placeholder="Ingresa tu correo electrÃ³nico"
            className="w-full sm:flex-1 rounded-xl border border-[rgba(148,163,184,0.34)] bg-[rgba(255,255,255,0.72)] px-4 py-3 text-sm text-[var(--foreground)] shadow-none outline-none transition-all placeholder:text-[var(--neutral-500)]"
          />
          <Link
            href="/register"
            className="w-full sm:w-auto shrink-0 font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Comenzar gratis
          </Link>
        </div>

        <p className="relative z-10 text-xs" style={{ color: 'var(--neutral-600)' }}>
          Â¿Ya tienes cuenta?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--primary)' }}>
            Inicia sesiÃ³n
          </Link>
        </p>

        {/* Preview dashboard */}
        <div className="relative z-10 mt-16 w-full max-w-5xl">
          <div className="rounded-2xl border overflow-hidden shadow-2xl shadow-[rgba(15,23,42,0.25)]" style={{ borderColor: 'var(--neutral-200)', backgroundColor: 'rgba(255,255,255,0.62)' }}>

            {/* Barra browser */}
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ backgroundColor: 'rgba(248,251,255,0.75)', borderColor: 'var(--neutral-200)' }}>
              <div className="flex gap-1.5">
                <div className="h-3 w-3 rounded-full bg-red-500/70" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                <div className="h-3 w-3 rounded-full bg-green-500/70" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="rounded-md px-3 py-1 text-xs flex items-center gap-2 w-48" style={{ backgroundColor: 'rgba(255,255,255,0.75)', border: '1px solid var(--neutral-200)', color: 'var(--neutral-600)' }}>
                  <span className="h-2 w-2 rounded-full bg-green-400/60" />
                  nearyx.app/dashboard
                </div>
              </div>
            </div>

            {/* Contenido preview */}
            <div className="p-4 min-h-70 flex gap-4" style={{ backgroundColor: '#0f172a' }}>

              {/* Sidebar simulado */}
              <div className="w-12 flex flex-col items-center gap-4 py-2">
                {['ðŸ ', 'ðŸ—ºï¸', 'ðŸ’¬', 'ðŸ‘¤'].map((icon, i) => (
                  <div key={i} className={`h-9 w-9 rounded-xl flex items-center justify-center text-sm ${i === 0 ? 'bg-[rgba(0,88,255,0.18)]' : ''}`} style={{ color: i === 0 ? 'var(--primary)' : 'rgba(253,251,212,0.20)' }}>
                    {icon}
                  </div>
                ))}
              </div>

              {/* Feed simulado */}
              <div className="flex-1 space-y-3">
                {[
                  { name: 'Carlos M.', time: '2m', text: 'Â¿Alguien que me ayude con cÃ¡lculo diferencial? Tengo examen el viernes ðŸ“', likes: 4 },
                  { name: 'Ana GarcÃ­a', time: '15m', text: 'Experta en Python disponible este fin de semana. Te enseÃ±o o lo resuelvo por ti. Â¡Primeras 2h con descuento! ðŸ', likes: 12 },
                ].map((post, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ backgroundColor: 'rgba(253,251,212,0.03)', border: '1px solid rgba(253,251,212,0.06)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: 'rgba(0,88,255,0.30)', color: 'var(--ui-dark-panel-text)' }}>
                        {post.name[0]}
                      </div>
                      <span className="text-xs font-medium" style={{ color: 'rgba(253,251,212,0.70)' }}>{post.name}</span>
                      <span className="text-xs" style={{ color: 'rgba(253,251,212,0.25)' }}>Â· {post.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'rgba(253,251,212,0.50)' }}>{post.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'rgba(253,251,212,0.25)' }}>
                      <span>â¤ï¸ {post.likes}</span>
                      <span>ðŸ’¬ Comentar</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar derecho simulado */}
              <div className="hidden md:block w-44 space-y-2">
                <p className="text-xs font-medium mb-3" style={{ color: 'rgba(253,251,212,0.35)' }}>Expertos cerca</p>
                {['Julia R.', 'Marco A.', 'Sofia L.'].map((name, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg p-2" style={{ backgroundColor: 'rgba(253,251,212,0.03)' }}>
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs shrink-0" style={{ backgroundColor: 'rgba(0,88,255,0.25)', color: 'var(--ui-dark-panel-text)' }}>
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
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(0,88,255,0.18)' }} />
        </div>
      </section>

      {/* â”€â”€ FEATURES â”€â”€ */}
      <section id="features" className="relative py-32 px-6 max-w-6xl mx-auto" style={{ backgroundColor: 'var(--accent-cream)' }}>

        <div className="text-center mb-16">
          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--primary)', fontFamily: 'var(--font-body)' }}>
            Por quÃ© Nearyx
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)', fontWeight: 500 }}>
            Todo lo que necesitas
            <br />
            para resolver o aprender
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--neutral-700)', fontFamily: 'var(--font-body)' }}>
            Una plataforma construida para conectar personas con expertos que pueden enseÃ±arte, asesorarte o trabajar directamente para ti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <MapPin className="h-7 w-7" />,
              iconColor: '#7C3AED',
              borderColor: 'rgba(124,58,237,0.20)',
              title: 'Mapa interactivo',
              desc: 'Encuentra expertos disponibles ahora mismo cerca de tu ubicaciÃ³n. Radio de bÃºsqueda inteligente que se expande automÃ¡ticamente.',
            },
            {
              icon: <MessageCircle className="h-7 w-7" />,
              iconColor: '#2563EB',
              borderColor: 'rgba(37,99,235,0.20)',
              title: 'Chat en tiempo real',
              desc: 'Habla directamente con el experto. Sin intermediarios, sin esperas. MensajerÃ­a instantÃ¡nea con WebSockets.',
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
              title: 'BÃºsqueda por Ã¡rea',
              desc: 'Filtra por la materia o servicio que necesitas y el mapa muestra solo los expertos disponibles en tu zona.',
            },
            {
              icon: <Bell className="h-7 w-7" />,
              iconColor: 'var(--primary)',
              borderColor: 'rgba(0,88,255,0.20)',
              title: 'Notificaciones al instante',
              desc: 'Recibe alertas cuando un experto responde, cuando hay uno disponible cerca o cuando alguien interactÃºa con tu publicaciÃ³n.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="relative p-6 rounded-2xl border hover:shadow-lg transition-all group cursor-default"
              style={{ borderColor: f.borderColor, backgroundColor: 'rgba(56,36,13,0.04)' }}
            >
              <div className="relative z-10">
                <div className="mb-4" style={{ color: f.iconColor }}>{f.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-body)' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* â”€â”€ HOW IT WORKS â”€â”€ */}
      <section id="how" className="py-24 px-6 border-t" style={{ borderColor: 'var(--neutral-200)' }}>
        <div className="max-w-4xl mx-auto text-center">

          <p className="text-sm font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--primary)', fontFamily: 'var(--font-body)' }}>
            CÃ³mo funciona
          </p>
          <h2 className="text-4xl font-bold tracking-tight mb-16" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
            En 3 pasos simples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-1/4 right-1/4 h-px pointer-events-none" style={{ background: 'linear-gradient(to right, transparent, rgba(0,88,255,0.38), transparent)' }} />

            {[
              {
                step: '01',
                icon: <BookOpen className="h-7 w-7" />,
                title: 'Crea tu cuenta',
                desc: 'RegÃ­strate como cliente o experto en menos de 1 minuto.',
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
                desc: 'Que te lo enseÃ±en, te asesoren o lo hagan por ti â€” tÃº decides cÃ³mo quieres trabajar.',
              },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="h-16 w-16 rounded-2xl border flex items-center justify-center shadow-lg" style={{ backgroundColor: 'rgba(0,88,255,0.10)', borderColor: 'rgba(0,88,255,0.20)', color: 'var(--primary)' }}>
                    {s.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--primary)', color: 'var(--ui-dark-panel-text)' }}>
                    {s.step[1]}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-body)' }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA FINAL â”€â”€ */}
      <section className="py-24 px-6">
        <div className="relative max-w-3xl mx-auto text-center rounded-3xl border p-12 overflow-hidden" style={{ borderColor: 'rgba(0,88,255,0.20)', backgroundColor: 'rgba(142,197,252,0.14)' }}>

          <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,88,255,0.10), transparent)' }} />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-32 blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(0,88,255,0.18)' }} />

          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)', fontWeight: 700 }}>
              Empieza hoy mismo
            </h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-body)' }}>
              Ãšnete a usuarios y expertos que ya estÃ¡n conectando en Nearyx.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] text-sm" style={{ backgroundColor: 'var(--primary)', color: 'var(--ui-dark-panel-text)', boxShadow: 'rgba(0, 88, 255, 0.38) 0 8px 16px' }}>
                Crear cuenta gratis
              </Link>
              <Link href="/login" className="font-medium px-8 py-3.5 rounded-xl transition-all text-sm border" style={{ borderColor: 'rgba(148,163,184,0.36)', backgroundColor: 'rgba(0,88,255,0.08)', color: 'var(--foreground)' }}>
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ FOOTER â”€â”€ */}
      <footer className="border-t py-8 px-6" style={{ borderColor: 'var(--neutral-200)', backgroundColor: 'var(--background)' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/nearyx-cafe.svg"
              alt="Nearyx"
              style={{ width: '22px', height: '22px', objectFit: 'contain' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-heading)' }}>
              Nearyx
            </span>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--neutral-600)', fontFamily: 'var(--font-body)' }}>
            MedellÃ­n, Colombia Â· 2025
          </p>
          <div className="flex gap-6 text-xs" style={{ color: 'var(--neutral-700)' }}>
            <Link href="/login" className="hover:underline transition-colors" style={{ fontFamily: 'var(--font-body)' }}>Iniciar sesiÃ³n</Link>
            <Link href="/register" className="hover:underline transition-colors" style={{ fontFamily: 'var(--font-body)' }}>Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}

