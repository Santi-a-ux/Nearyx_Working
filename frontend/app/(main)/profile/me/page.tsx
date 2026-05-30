import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import TutorPaymentSettings from "@/components/profile/tutor-payment-settings";

interface UserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location_name?: string;
}

interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  display_name?: string;
}

interface TutorProfile {
  specialties?: string[];
  categories?: string[];
  hourly_rate?: number;
  years_experience?: number;
  is_available?: boolean;
  preferred_payment_method?: string;
}

export default async function MyProfilePage() {
  const userProfile = await fetchApi<UserProfile>("/users/me").catch(() => null);
  const authUser = await fetchApi<AuthUser>("/auth/me").catch(() => null);
  const tutorProfile = await fetchApi<TutorProfile>("/tutors/profiles/me").catch(() => null);

  if (!userProfile && !authUser) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Perfil no disponible</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">No pudimos cargar tu perfil</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Intenta volver a entrar o revisa la sesión activa.</p>
          <div className="mt-6 flex justify-center">
            <Link href="/dashboard">
              <Button className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const resolvedUserId = userProfile?.user_id || authUser?.id || "";
  const fallbackName = authUser?.display_name || authUser?.email?.split("@")[0] || "Mi Perfil";
  const resolvedDisplayName = userProfile?.display_name || fallbackName;
  const resolvedLocation = userProfile?.location_name || "Sin ubicación";
  const resolvedBio = userProfile?.bio || "Aún no has agregado una biografía.";
  const avatarSeed = resolvedUserId || resolvedDisplayName;
  const skills = [...(tutorProfile?.specialties || []), ...(tutorProfile?.categories || [])];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
      <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
        <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1e40af_52%,#dbeafe_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_36%)]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative px-6 pb-6 pt-0 lg:px-8 lg:pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="-mt-20 flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                <AvatarImage src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={resolvedDisplayName} />
                <AvatarFallback className="bg-brand-dark text-white text-2xl">{resolvedDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="max-w-2xl pb-2">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Mi perfil</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{resolvedDisplayName}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{resolvedLocation}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">{resolvedBio}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pb-2">
              <EditProfileDialog
                initialData={{
                  display_name: resolvedDisplayName,
                  bio: userProfile?.bio,
                  location_name: userProfile?.location_name,
                }}
              />
              {!tutorProfile && (
                <Link href="/tutor/onboarding">
                  <Button className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90">Crear perfil de tutor</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Correo</p>
              <p className="mt-2 break-words text-sm font-semibold text-foreground">{authUser?.email || "No disponible"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rol</p>
              <p className="mt-2 text-sm font-semibold capitalize text-foreground">{authUser?.role || "No disponible"}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ubicación</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{resolvedLocation}</p>
            </div>
          </div>
        </div>
      </div>

      {tutorProfile ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Perfil de tutor</p>
                <h2 className="mt-2 text-xl font-bold text-foreground">Disponibilidad y habilidades</h2>
              </div>
              <Badge className={tutorProfile.is_available ? "bg-semantic-success/10 text-semantic-success" : "bg-muted text-muted-foreground"}>
                {tutorProfile.is_available ? "Disponible" : "No disponible"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tarifa por hora</p>
                <p className="mt-2 text-lg font-bold text-foreground">${tutorProfile.hourly_rate || 0}</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Años de experiencia</p>
                <p className="mt-2 text-lg font-bold text-foreground">{tutorProfile.years_experience ?? 1}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="rounded-full border border-primary bg-brand-soft px-3 py-1 text-primary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todavía no has agregado especialidades.</p>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-border bg-brand-dark p-6 text-white shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/60">Cobros</p>
            <h2 className="mt-2 text-xl font-bold">Método de pago</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">Configura el método que usarás para recibir pagos y mantener tu perfil listo para clases.</p>
            <div className="mt-5 rounded-2xl bg-white/10 p-4">
              <TutorPaymentSettings initial={tutorProfile.preferred_payment_method} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[28px] border border-dashed border-border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Perfil de tutor</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Todavía no tienes un perfil de tutor</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Completa tu onboarding para aparecer en la búsqueda, mostrar tarifas y recibir mensajes.</p>
            </div>
            <Link href="/tutor/onboarding">
              <Button className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90">Ir al onboarding</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
