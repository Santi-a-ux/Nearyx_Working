import { fetchApi } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconMessages, IconMap } from "@/components/icons/TmIcons";
import MessageButton from "@/components/message-button";
import TutorRating from "@/components/profile/tutor-rating";
import { Clock } from "lucide-react";
import Link from "next/link";

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
      <div className="p-6 text-center">
        <h2 className="mb-2 text-2xl font-bold" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>Tutor no encontrado</h2>
        <p className="mb-4" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>{errorMsg}</p>
        <Link href="/dashboard"><Button>Volver al inicio</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="relative">
        <div className="relative h-40 w-full overflow-hidden rounded-2xl" style={{ backgroundColor: '#C4783A' }}>
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(196, 120, 58, 0.20)' }} />
        </div>
        <div className="absolute left-6 -bottom-8">
          <Avatar className="h-32 w-32 border-4 shadow-lg" style={{ borderColor: '#FFFFFF' }}>
            <AvatarImage
              src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`}
              alt={userProfile?.display_name || "Perfil disponible"}
            />
            <AvatarFallback>{(userProfile?.display_name || "PD").substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="rounded-2xl border p-6 pt-10 shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: 'rgba(56, 36, 13, 0.28)' }}>
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="flex-1 pl-2">
            <div className="ml-0 md:ml-0">
              <h1 className="text-2xl font-bold" style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>{userProfile?.display_name || "Perfil disponible"}</h1>
              <p className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>{tutor.headline || userProfile?.bio || 'Especialista disponible'}</p>
            </div>

            <div className="mt-4 flex gap-4">
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Clases dadas</span>
                <span className="font-semibold" style={{ color: 'rgba(56, 36, 13, 0.80)', fontFamily: 'var(--font-main)' }}>—</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Rating</span>
                <span className="text-sm font-semibold" style={{ color: 'rgba(56, 36, 13, 0.80)', fontFamily: 'var(--font-main)' }}>
                  {tutor.average_rating != null ? `${Number(tutor.average_rating).toFixed(1)} / 5` : "Sin valoraciones"}
                </span>
                <span className="text-xs" style={{ color: 'rgba(56, 36, 13, 0.50)', fontFamily: 'var(--font-main)' }}>
                  {tutor.ratings_count ? `${tutor.ratings_count} valoraciones` : ""}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Años exp.</span>
                <span className="font-semibold" style={{ color: 'rgba(56, 36, 13, 0.80)', fontFamily: 'var(--font-main)' }}>{tutor.years_experience ?? 1}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <MessageButton userId={tutor.user_id} />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-semibold" style={{ color: 'rgba(56, 36, 13, 0.80)', fontFamily: 'var(--font-main)' }}>Habilidades</h3>
          <div className="flex flex-wrap gap-2">
            {((tutor.specialties || []).concat(tutor.categories || [])).map((s: string, i: number) => (
              <span key={i} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: 'rgba(196, 120, 58, 0.20)', backgroundColor: 'rgba(196, 120, 58, 0.10)', color: '#C4783A', fontFamily: 'var(--font-main)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3" style={{ backgroundColor: 'rgba(56, 36, 13, 0.05)' }}>
          <TabsTrigger value="about">Sobre Mí</TabsTrigger>
          <TabsTrigger value="skills">Habilidades</TabsTrigger>
          <TabsTrigger value="reviews">Reseñas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>Biografía</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap leading-relaxed" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
                {userProfile?.bio || "Este tutor aún no ha añadido una biografía."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle style={{ color: '#38240D', fontFamily: 'var(--font-main)' }}>Habilidades y Especialidades</CardTitle>
              <CardDescription style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>Materias y tecnologías que enseña este tutor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {((tutor.specialties?.length || 0) > 0 || (tutor.categories?.length || 0) > 0) ? (
                  [...(tutor.specialties || []), ...(tutor.categories || [])].map((skill, index) => (
                    <Badge key={index} variant="secondary" className="border px-3 py-1 text-sm" style={{ borderColor: 'rgba(196, 120, 58, 0.20)', backgroundColor: 'rgba(196, 120, 58, 0.10)', color: '#C4783A', fontFamily: 'var(--font-main)' }}>
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-white/50">No ha especificado habilidades.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          <div className="space-y-4">
            <TutorRating
              tutorUserId={tutor.user_id}
              initialAverage={tutor.average_rating}
              initialCount={tutor.ratings_count ?? 0}
            />
          <Card>
            <CardContent className="py-10 text-center text-white/50">
              <p>Aún no hay reseñas para mostrar.</p>
            </CardContent>
          </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
