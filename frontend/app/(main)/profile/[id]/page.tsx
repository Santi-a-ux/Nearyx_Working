import Link from "next/link";

import { fetchApi } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MessageButton from "@/components/message-button";
import TutorRating from "@/components/profile/tutor-rating";
import { Clock, MapPin, MessageCircle, Star } from "lucide-react";

interface TutorProfile {
  user_id: string;
  specialties?: string[];
  categories?: string[];
  headline?: string;
  hourly_rate?: number;
  years_experience?: number;
  average_rating?: number | null;
  ratings_count?: number;
  lat?: number;
  lng?: number;
  is_available?: boolean;
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
  let errorMsg = null;

  try {
    tutor = await fetchApi<TutorProfile>(`/tutors/${id}`);
    userProfile = await fetchApi<UserProfile>(`/users/profiles/${id}`).catch(() => null);
  } catch (error: unknown) {
    const err = error as Error;
    errorMsg = err.message || "No se pudo cargar el perfil del tutor";
  }

  if (errorMsg || !tutor) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-border bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Tutor no encontrado</p>
          <h2 className="mt-3 text-2xl font-bold text-foreground">No pudimos cargar este perfil</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{errorMsg || "El perfil solicitado no está disponible."}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button className="rounded-xl px-5">Volver al inicio</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const displayName = userProfile?.display_name || "Perfil disponible";
  const bio = tutor.headline || userProfile?.bio || "Especialista disponible";
  const skills = [...(tutor.specialties || []), ...(tutor.categories || [])];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:py-8">
      <div className="overflow-hidden rounded-[28px] border border-border bg-white shadow-sm">
        <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_55%,#dbeafe_100%)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.24),transparent_34%)]" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative px-6 pb-6 pt-0 lg:px-8 lg:pb-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="-mt-20 flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]">
                <AvatarImage src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`} alt={displayName} />
                <AvatarFallback className="bg-[#0f172a] text-white text-2xl">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="max-w-2xl pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Perfil público</p>
                  <Badge className={tutor.is_available ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}>
                    {tutor.is_available ? "Disponible" : "No disponible"}
                  </Badge>
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">{displayName}</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{userProfile?.location_name || "Sin ubicación pública"}</p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/80">{bio}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pb-2">
              <MessageButton userId={tutor.user_id} />
              <Link href={`/messages?userId=${tutor.user_id}`}>
                <Button variant="outline" className="rounded-xl border-border px-5">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Abrir chat
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-border bg-background p-4">
              <Clock className="h-4 w-4 text-primary" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tarifa</p>
              <p className="mt-2 text-lg font-bold text-foreground">${tutor.hourly_rate || 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <Star className="h-4 w-4 text-primary" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rating</p>
              <p className="mt-2 text-lg font-bold text-foreground">
                {tutor.average_rating != null ? `${Number(tutor.average_rating).toFixed(1)} / 5` : "Nuevo"}
              </p>
              {tutor.ratings_count ? <p className="text-xs text-muted-foreground">{tutor.ratings_count} valoraciones</p> : null}
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Experiencia</p>
              <p className="mt-2 text-lg font-bold text-foreground">{tutor.years_experience ?? 1} años</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <MessageCircle className="h-4 w-4 text-primary" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ubicación</p>
              <p className="mt-2 text-lg font-bold text-foreground">{userProfile?.location_name || "Sin dato"}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="about" className="mt-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3 rounded-2xl border border-border bg-white p-1 shadow-sm">
          <TabsTrigger value="about" className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Sobre mí</TabsTrigger>
          <TabsTrigger value="skills" className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Habilidades</TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-xl data-[state=active]:bg-[#0f172a] data-[state=active]:text-white">Reseñas</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-4">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Biografía</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{userProfile?.bio || "Este tutor aún no ha añadido una biografía."}</p>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Habilidades y especialidades</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.length > 0 ? (
                skills.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} variant="secondary" className="rounded-full px-3 py-1">{skill}</Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No ha especificado habilidades.</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            <TutorRating
              tutorUserId={tutor.user_id}
              initialAverage={tutor.average_rating}
              initialCount={tutor.ratings_count ?? 0}
            />
            <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted-foreground">Reseñas</p>
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-background p-8 text-center text-sm text-muted-foreground">
                Aún no hay reseñas escritas para mostrar.
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
