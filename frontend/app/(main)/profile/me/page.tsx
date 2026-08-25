import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog";
import { ProfileExpertActions } from "@/components/profile/profile-expert-actions";
import { VerificationStatusActions } from "@/components/profile/verification-status-actions";
import TutorPaymentSettings from "@/components/profile/tutor-payment-settings";
import { ProfileNetwork, type NetworkRecommendations } from "@/components/profile/profile-network";
import NetworkGraphBackground from "@/components/NetworkGraphBackground";
import { appCardClass, appCardInnerClass, appCardSoftClass } from "@/lib/surface-styles";
import { normalizeVerificationStatus, type VerificationRequest } from "@/lib/verification";

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
  verification_status?: string;
}

export default async function MyProfilePage() {
  const userProfile = await fetchApi<UserProfile>("/users/me").catch(() => null);
  const authUser = await fetchApi<AuthUser>("/auth/me").catch(() => null);
  const tutorProfile = await fetchApi<TutorProfile>("/tutors/profiles/me").catch(() => null);
  const network = userProfile?.user_id
    ? await fetchApi<NetworkRecommendations>(`/tutors/recommendations/${userProfile.user_id}`).catch(() => null)
    : null;
  const verificationRequest = tutorProfile
    ? await fetchApi<VerificationRequest>("/tutors/verification/me").catch(() => null)
    : null;

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

  const fallbackName = authUser?.display_name || authUser?.email?.split("@")[0] || "Mi Perfil";
  const resolvedDisplayName = userProfile?.display_name || fallbackName;
  const resolvedLocation = userProfile?.location_name || "Sin ubicación";
  const resolvedBio = userProfile?.bio || "Aún no has agregado una biografía.";
  const skills = [...(tutorProfile?.specialties || []), ...(tutorProfile?.categories || [])];
  const verificationStatus = normalizeVerificationStatus(tutorProfile?.verification_status);
  const rejectionNotes =
    verificationStatus === "rejected" && verificationRequest?.status === "rejected"
      ? verificationRequest.review_notes
      : null;

  return (
    <div className="relative z-10 mx-auto max-w-4xl px-4 py-6 lg:py-8">
      {userProfile?.user_id && (
        <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
          <NetworkGraphBackground userId={userProfile.user_id} />
        </div>
      )}
      <div className={`overflow-hidden ${appCardClass} bg-white/85 backdrop-blur-md`}>
        <div className="border-b border-border/60 bg-[linear-gradient(180deg,#EEF6FF_0%,#F8FBFF_100%)]/85 px-6 py-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <UserAvatar name={resolvedDisplayName} size="profile" avatarUrl={userProfile?.avatar_url} />

              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Mi perfil</p>
                  {tutorProfile && (
                    <VerificationStatusActions
                      status={tutorProfile.verification_status}
                      request={verificationRequest}
                    />
                  )}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#10314F]">{resolvedDisplayName}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{resolvedLocation}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">{resolvedBio}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <EditProfileDialog
                initialData={{
                  display_name: resolvedDisplayName,
                  bio: userProfile?.bio,
                  location_name: userProfile?.location_name,
                }}
              />
              {!tutorProfile && <ProfileExpertActions />}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 lg:px-8">
          <div className="grid gap-3 md:grid-cols-3">
            <div className={`${appCardInnerClass} bg-white/70`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Correo</p>
              <p className="mt-2 break-words text-sm font-semibold text-[#10314F]">{authUser?.email || "No disponible"}</p>
            </div>
            <div className={`${appCardInnerClass} bg-white/70`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rol</p>
              <p className="mt-2 text-sm font-semibold text-[#10314F]">
                {authUser?.role === "tutor" ? "Experto" : authUser?.role === "student" ? "Estudiante" : authUser?.role || "No disponible"}
              </p>
            </div>
            <div className={`${appCardInnerClass} bg-white/70`}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ubicación</p>
              <p className="mt-2 text-sm font-semibold text-[#10314F]">{resolvedLocation}</p>
            </div>
          </div>
        </div>
      </div>

      {rejectionNotes && (
        <div className={`mt-6 ${appCardClass} border-semantic-error/30 bg-white/85 backdrop-blur-md p-6`}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-semantic-error">
            Verificación rechazada
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#10314F]">Revisa lo que falta y vuelve a enviar</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{rejectionNotes}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Usa el botón &laquo;Corregir y reenviar&raquo; junto a tu nombre para actualizar la solicitud.
          </p>
        </div>
      )}

      <ProfileNetwork network={network} />

      {tutorProfile ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className={`${appCardClass} bg-white/85 backdrop-blur-md p-6`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Perfil de experto</p>
                <h2 className="mt-2 text-xl font-bold text-[#10314F]">Disponibilidad y habilidades</h2>
              </div>
              <Badge className={tutorProfile.is_available ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-muted text-muted-foreground"}>
                {tutorProfile.is_available ? "Disponible" : "No disponible"}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className={`${appCardInnerClass} bg-white/70`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tarifa por hora</p>
                <p className="mt-2 text-lg font-bold text-[#10314F]">${tutorProfile.hourly_rate || 0}</p>
              </div>
              <div className={`${appCardInnerClass} bg-white/70`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Años de experiencia</p>
                <p className="mt-2 text-lg font-bold text-[#10314F]">{tutorProfile.years_experience ?? 1}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="rounded-full border border-[#2563EB]/20 bg-[#EEF6FF] px-3 py-1 text-[#2563EB]">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Todavía no has agregado especialidades.</p>
              )}
            </div>
          </div>

          <div className={`${appCardSoftClass} bg-white/75 backdrop-blur-md p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Cobros</p>
            <h2 className="mt-2 text-xl font-bold text-[#10314F]">Método de pago</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Configura el método que usarás para recibir pagos y mantener tu perfil listo para clases.
            </p>
            <div className={`mt-5 ${appCardInnerClass} bg-white/85`}>
              <TutorPaymentSettings initial={tutorProfile.preferred_payment_method} />
            </div>
          </div>
        </div>
      ) : (
        <div className={`mt-6 ${appCardSoftClass} border-dashed bg-white/75 backdrop-blur-md p-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Perfil de experto</p>
              <h2 className="mt-2 text-xl font-bold text-foreground">Todavía no tienes un perfil de experto</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Completa tu onboarding para aparecer en la búsqueda, mostrar tarifas y recibir mensajes.</p>
            </div>
            <ProfileExpertActions triggerLabel="Completar perfil de experto" />
          </div>
        </div>
      )}
    </div>
  );
}