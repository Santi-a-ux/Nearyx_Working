import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageButton from "@/components/message-button";
import TutorRating from "@/components/profile/tutor-rating";
import { VerificationBadge } from "@/components/profile/verification-badge";
import { appCardClass, appCardInnerClass } from "@/lib/surface-styles";
import {
  formatYearRange,
  hasPublicVerificationData,
  isVerified,
  type VerificationPublic,
} from "@/lib/verification";
import { Clock, MapPin, MessageCircle, Star } from "lucide-react";
import {ScreenReaderSection} from "@/components/ui/screen-reader-section";
interface TutorProfile {
  user_id: string;
  specialties?: string[];
  categories?: string[];
  headline?: string;
  hourly_rate?: number;
  years_experience?: number;
  lat?: number;
  lng?: number;
  is_available?: boolean;
  verification_status?: string;
}

interface UserProfile {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  location_name?: string;
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let tutor: TutorProfile | null = null;
  let userProfile: UserProfile | null = null;
  let verification: VerificationPublic | null = null;
  let errorMsg = null;

  try {
    tutor = await fetchApi<TutorProfile>(`/tutors/${id}`);
    userProfile = await fetchApi<UserProfile>(`/users/profiles/${id}`).catch(() => null);
    verification = await fetchApi<VerificationPublic>(`/tutors/verification/${id}`).catch(() => null);
  } catch (error: unknown) {
    const err = error as Error;
    errorMsg = err.message || "No se pudo cargar el perfil del experto";
  }

  if (errorMsg || !tutor) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Experto no encontrado</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">No pudimos cargar este perfil</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{errorMsg || "El perfil solicitado no está disponible."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button className="rounded-xl bg-brand-dark px-5 text-white hover:bg-brand-dark/90">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.display_name || "Perfil disponible";
  const bio = tutor.headline || userProfile?.bio || "Especialista disponible";
  const skills = [...(tutor.specialties || []), ...(tutor.categories || [])];
  const tutorIsVerified = isVerified(tutor.verification_status);
  const showCredentials = tutorIsVerified && hasPublicVerificationData(verification);
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
      <div className={`overflow-hidden ${appCardClass}`}>
        <ScreenReaderSection
          text={`Perfil de ${displayName}. ${
            tutor.is_available ? "Está disponible." : "No está disponible."
          } Ubicación: ${
            userProfile?.location_name || "sin ubicación pública"
          }. ${bio}`}
          className="border-b border-border/60 bg-[linear-gradient(180deg,#EEF6FF_0%,#F8FBFF_100%)] px-6 py-6 lg:px-8 lg:py-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
              <UserAvatar name={displayName} size="profileLg" avatarUrl={userProfile?.avatar_url} />

              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#10314F]/55">Perfil público</p>
                  <Badge className={tutor.is_available ? "bg-[#CCFBF1] text-[#0F766E]" : "bg-muted text-muted-foreground"}>
                    {tutor.is_available ? "Disponible" : "No disponible"}
                  </Badge>
                  {tutorIsVerified && <VerificationBadge />}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#10314F]">{displayName}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{userProfile?.location_name || "Sin ubicación pública"}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">{bio}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <MessageButton userId={tutor.user_id} />
              <Link href={`/messages?userId=${tutor.user_id}`}>
                <Button aria-label={`Abrir chat con ${displayName}`} variant="outline" className="rounded-xl border-border bg-[#EEF6FF] px-5 text-[#2563EB] hover:bg-[#E0EFFF]">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Abrir chat
                </Button>
              </Link>
            </div>
          </div>
        </ScreenReaderSection>

        <ScreenReaderSection
          text={`Información del experto. Tarifa: ${
            tutor.hourly_rate || 0
          } pesos por hora. Experiencia: ${
            tutor.years_experience ?? 1
          } años. Ubicación: ${
            userProfile?.location_name || "Sin dato"
          }. Contacto: listo para responder.`}
          className="px-6 py-6 lg:px-8"
        >
          <div className="grid gap-3 md:grid-cols-4">
            <div className={appCardInnerClass}>
              <Clock className="h-4 w-4 text-[#2563EB]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tarifa</p>
              <p className="mt-2 text-lg font-bold text-[#10314F]">${tutor.hourly_rate || 0}</p>
            </div>
            <div className={appCardInnerClass}>
              <Star className="h-4 w-4 text-[#2563EB]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Experiencia</p>
              <p className="mt-2 text-lg font-bold text-[#10314F]">{tutor.years_experience ?? 1} años</p>
            </div>
            <div className={appCardInnerClass}>
              <MapPin className="h-4 w-4 text-[#2563EB]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ubicación</p>
              <p className="mt-2 text-lg font-bold text-[#10314F]">{userProfile?.location_name || "Sin dato"}</p>
            </div>
            <div className={appCardInnerClass}>
              <MessageCircle className="h-4 w-4 text-[#2563EB]" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contacto</p>
              <p className="mt-2 text-lg font-bold text-[#10314F]">Listo para responder</p>
            </div>
          </div>
         </ScreenReaderSection>
      </div>

      <Tabs defaultValue="about" className="mt-6">
        <TabsList
          className={`grid w-full ${showCredentials ? "max-w-2xl grid-cols-4" : "max-w-xl grid-cols-3"} rounded-2xl border border-border bg-white p-1 shadow-sm`}
        >
          <TabsTrigger value="about" className="rounded-xl data-[state=active]:bg-brand-dark data-[state=active]:text-white">Sobre mí</TabsTrigger>
          {showCredentials && (
            <TabsTrigger value="credentials" className="rounded-xl data-[state=active]:bg-brand-dark data-[state=active]:text-white">Formación</TabsTrigger>
          )}
          <TabsTrigger value="skills" className="rounded-xl data-[state=active]:bg-brand-dark data-[state=active]:text-white">Habilidades</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl data-[state=active]:bg-brand-dark data-[state=active]:text-white">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <ScreenReaderSection
            text={`Sección Sobre mí. Biografía: ${
              userProfile?.bio ||
              "Este experto aún no ha añadido una biografía."
            }`}
          >
          <div className={`${appCardClass} p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Biografía</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{userProfile?.bio || "Este experto aún no ha añadido una biografía."}</p>
          </div>
          </ScreenReaderSection>
        </TabsContent>

        {showCredentials && verification && (
          <TabsContent value="credentials" className="mt-4">
            <div className={`${appCardClass} space-y-6 p-6`}>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Información académica y profesional verificada
              </p>

              {verification.summary && (
                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">{verification.summary}</p>
              )}

              {verification.education.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-[#10314F]">Formación académica</h3>
                  {verification.education.map((item, index) => (
                    <div key={`edu-${index}`} className={appCardInnerClass}>
                      <p className="text-sm font-bold text-[#10314F]">{item.degree}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{item.institution}</p>
                      {item.field && <p className="mt-1 text-sm text-foreground/70">{item.field}</p>}
                      {formatYearRange(item.start_year, item.end_year) && (
                        <p className="mt-2 text-caption text-muted-foreground">
                          {formatYearRange(item.start_year, item.end_year)}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}

              {verification.certifications.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-[#10314F]">Certificaciones y cursos</h3>
                  {verification.certifications.map((item, index) => (
                    <div key={`cert-${index}`} className={appCardInnerClass}>
                      <p className="text-sm font-bold text-[#10314F]">{item.name}</p>
                      {item.issuer && <p className="mt-1 text-sm text-muted-foreground">{item.issuer}</p>}
                      {item.year && <p className="mt-2 text-caption text-muted-foreground">{item.year}</p>}
                    </div>
                  ))}
                </section>
              )}

              {verification.experience.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-bold text-[#10314F]">Experiencia</h3>
                  {verification.experience.map((item, index) => (
                    <div key={`exp-${index}`} className={appCardInnerClass}>
                      <p className="text-sm font-bold text-[#10314F]">{item.role}</p>
                      {item.organization && (
                        <p className="mt-1 text-sm text-muted-foreground">{item.organization}</p>
                      )}
                      {formatYearRange(item.start_year, item.end_year) && (
                        <p className="mt-2 text-caption text-muted-foreground">
                          {formatYearRange(item.start_year, item.end_year)}
                        </p>
                      )}
                      {item.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </section>
              )}
            </div>
          </TabsContent>
        )}

        <TabsContent value="skills" className="mt-4">
          <ScreenReaderSection
              text={`Sección Habilidades y especialidades. ${
                  skills.length > 0
                  ? `Habilidades: ${skills.join(", ")}.`
                  : "No ha especificado habilidades."
              }`}
          >
          <div className={`${appCardClass} p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Habilidades y especialidades</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="rounded-full border border-[#2563EB]/20 bg-[#EEF6FF] px-3 py-1 text-[#2563EB]">
                    {skill}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No ha especificado habilidades.</p>
              )}
            </div>
          </div>
          </ScreenReaderSection>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <ScreenReaderSection
            text="Sección de reseñas. Aquí se muestran las valoraciones realizadas por los estudiantes."
          >
          <div className={`${appCardClass} p-6`}>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Reseñas</p>
            <div className="mt-4 space-y-4">
              <TutorRating tutorUserId={tutor.user_id} />
              <div className={`${appCardInnerClass} border-dashed bg-white p-8 text-center text-sm text-muted-foreground`}>
                Las valoraciones se actualizan en tiempo real conforme los estudiantes califican.
              </div>
            </div>
          </div>
          </ScreenReaderSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
