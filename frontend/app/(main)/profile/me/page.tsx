import { fetchApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
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
}

export default async function MyProfilePage() {
  const userProfile = await fetchApi<UserProfile>("/users/me").catch(() => null);
  const authUser = await fetchApi<AuthUser>("/auth/me").catch(() => null);
  const tutorProfile = await fetchApi<TutorProfile>("/tutors/profiles/me").catch(() => null);

  if (!userProfile && !authUser) {
    return (
      <div className="p-6 text-center">
        <h2 className="mb-2 text-2xl font-bold" style={{ color: 'var(--color-surface)', fontFamily: 'var(--font-main)' }}>Perfil no disponible</h2>
        <p className="mb-4" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>No se pudo cargar tu perfil de usuario.</p>
        <Link href="/dashboard">
          <Button style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-bg)' }}>Volver al Dashboard</Button>
        </Link>
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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="rounded-[22px] border shadow-[0_24px_60px_rgba(56, 36, 13, 0.28)]" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'rgba(253, 251, 212, 0.25)' }}>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={userProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} alt={resolvedDisplayName} />
            <AvatarFallback>{(resolvedDisplayName || "US").substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="mb-1" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}>{resolvedDisplayName}</CardTitle>
            <CardDescription style={{ color: 'rgba(253, 251, 212, 0.70)', fontFamily: 'var(--font-main)' }}>{resolvedLocation}</CardDescription>
          </div>
          <EditProfileDialog initialData={{ 
            display_name: resolvedDisplayName,
            bio: userProfile?.bio,
            location_name: userProfile?.location_name
          }} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p style={{ color: 'rgba(253, 251, 212, 0.85)', fontFamily: 'var(--font-main)' }}>{resolvedBio}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-[16px] border p-4" style={{ backgroundColor: 'rgba(253, 251, 212, 0.04)', borderColor: 'rgba(253, 251, 212, 0.25)', fontFamily: 'var(--font-main)' }}>
            <div>
              <p className="text-xs" style={{ color: 'rgba(253, 251, 212, 0.50)' }}>Correo</p>
              <p className="font-medium" style={{ color: 'var(--color-bg)' }}>{authUser?.email || "No disponible"}</p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'rgba(253, 251, 212, 0.50)' }}>Rol</p>
              <p className="font-medium capitalize" style={{ color: 'var(--color-bg)' }}>{authUser?.role || "No disponible"}</p>
            </div>
          </div>

          {!userProfile && (
            <div className="rounded-[16px] border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
              <p className="mb-1 text-sm font-medium">Tu perfil básico está activo</p>
              <p className="text-sm text-amber-100/80">Aún no has completado la información extendida del perfil, pero ya puedes usar la plataforma.</p>
            </div>
          )}

          {tutorProfile ? (
            <div className="space-y-3">
              <div className="text-sm" style={{ fontFamily: 'var(--font-main)', color: 'var(--color-bg)' }}>
                <span className="font-medium" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Disponibilidad: </span>
                {tutorProfile.is_available ? "Disponible" : "No disponible"}
              </div>
              <div className="text-sm" style={{ fontFamily: 'var(--font-main)', color: 'var(--color-bg)' }}>
                <span className="font-medium" style={{ color: 'rgba(253, 251, 212, 0.60)' }}>Tarifa por hora: </span>
                ${tutorProfile.hourly_rate || 0}
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="border" style={{ borderColor: 'rgba(253, 251, 212, 0.2)', backgroundColor: 'rgba(253, 251, 212, 0.1)', color: 'var(--color-bg)' }}>{skill}</Badge>
                  ))}
                </div>
              )}
              <div className="pt-3">
                <TutorPaymentSettings initial={(tutorProfile as any).preferred_payment_method} />
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-white/8 bg-white/5 p-4">
              <p className="mb-3 text-sm text-white/50">Aún no tienes perfil de tutor.</p>
              <Link href="/tutor/onboarding">
                <Button size="sm" style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-surface)' }}>Crear perfil de tutor</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
