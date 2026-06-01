"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import { MapPreview } from "@/components/map/map-preview";
import { UserAvatar } from "@/components/user-avatar";
import { Badge } from "@/components/ui/badge";
import { cardElevatedClass } from "@/lib/surface-styles";
import { cn } from "@/lib/utils";

export interface DashboardTutorItem {
  user_id: string;
  display_name?: string;
  full_name?: string;
  specialties?: string[];
  avatar_url?: string;
  is_available?: boolean;
  average_rating?: number | null;
  ratings_count?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}

interface DashboardRightPanelProps {
  mapboxAccessToken: string;
  tutors: DashboardTutorItem[];
}

export function DashboardRightPanel({ mapboxAccessToken, tutors }: DashboardRightPanelProps) {
  const activeCount = tutors.filter((t) => t.is_available !== false).length;

  return (
    <aside className="hidden space-y-5 xl:block xl:w-[320px]">
      <Link href="/explore" className="block">
        <MapPreview
          accessToken={mapboxAccessToken}
          tutors={tutors}
          showLiveBadge
          maxPins={8}
          heightClassName="h-56 w-full"
          overlayMeta={activeCount > 0 ? `· ${activeCount} activos` : undefined}
        />
      </Link>

      <div className={cn(cardElevatedClass, "p-5")}>
        <div className="mb-4 flex items-center justify-between">
          <div className="text-label text-muted-foreground">Cerca de ti</div>
          <Link href="/explore" className="text-caption text-primary hover:underline">
            Ver todo
          </Link>
        </div>
        <ul className="space-y-4">
          {tutors.length === 0 ? (
            <li className="text-body text-muted-foreground">Aún no hay expertos para mostrar.</li>
          ) : (
            tutors.slice(0, 4).map((tutor) => (
              <li key={tutor.user_id} className="flex items-center gap-3">
                <UserAvatar
                  name={tutor.display_name || tutor.full_name || "Experto"}
                  size="sm"
                  avatarUrl={tutor.avatar_url}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-body font-medium">{tutor.display_name || tutor.full_name || "Experto"}</span>
                    <Badge variant="expert" className="hidden shrink-0 sm:inline-flex">
                      Experto
                    </Badge>
                  </div>
                  <div className="truncate text-caption text-muted-foreground">
                    {tutor.specialties?.[0] || "Experiencia general"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-caption text-muted-foreground">
                    <Star className="h-3 w-3 text-amber-500" />
                    {typeof tutor.average_rating === "number"
                      ? tutor.average_rating.toFixed(1)
                      : "—"}
                  </div>
                </div>
                <Link
                  href={`/messages?userId=${tutor.user_id}`}
                  className="text-caption shrink-0 font-medium text-primary hover:underline"
                >
                  Chat
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </aside>
  );
}
