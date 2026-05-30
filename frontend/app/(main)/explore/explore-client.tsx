"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { FEATURED_TOPICS } from "@/lib/constants";
import { buildTutorOccupationLabel, matchesTutorSearch, type TutorSearchRecord } from "@/lib/tutor-search";

interface Tutor {
  id?: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  specialties?: string[];
  categories?: string[];
  avatar_url?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
}

interface TutorsResponse {
  tutors?: Tutor[];
}

const MapboxMap = dynamic(() => import("@/components/map/MapboxMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-144 w-full rounded-2xl" />,
});

const categoryPills = ["Matemáticas", "Programación", "Idiomas", "Ciencias", "Música", "Diseño"];

export default function ExploreClient() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [mapTutors, setMapTutors] = useState<Tutor[]>([]);
  const [mapPhase, setMapPhase] = useState<'searching' | 'found' | 'empty' | 'idle'>('idle');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetchApi<Tutor[] | TutorsResponse>("/api/tutors/?limit=100").catch(() => [] as Tutor[]);
        const list = Array.isArray(res) ? res : res?.tutors ?? [];
        const enriched = await Promise.all(
          list.map(async (tutor) => {
            try {
              const profile = await fetchApi<{ display_name?: string; bio?: string; avatar_url?: string }>(`/api/users/profiles/${tutor.user_id}`);
              return { ...tutor, display_name: profile?.display_name || tutor.display_name, bio: profile?.bio || tutor.bio, avatar_url: profile?.avatar_url || tutor.avatar_url };
            } catch { return tutor; }
          })
        );
        if (active) setTutors(enriched);
      } catch { if (active) setTutors([]); }
    })();
    return () => { active = false; };
  }, []);

  const filteredTutors = useMemo(() => {
    const query = activeSearch.trim();
    if (!query) return tutors;
    return tutors.filter((tutor) => matchesTutorSearch(tutor as TutorSearchRecord, query));
  }, [activeSearch, tutors]);

  const visibleTutors = mapPhase === 'found' && mapTutors.length > 0 ? mapTutors : filteredTutors;

  return (
    <div className="flex h-full min-h-[calc(100vh-7rem)] gap-4">
      <aside className="w-60 shrink-0 rounded-2xl border border-border bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Resultados en vivo</p>
        <h2 className="mt-2 text-lg font-bold text-foreground">Tutores cerca de ti</h2>
        <p className="mt-1 text-sm text-muted-foreground">La lista se sincroniza con el mapa.</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") setActiveSearch(searchValue.trim()); }}
            placeholder="Buscar tutor o materia"
            className="h-10 rounded-lg border-[0.5px] border-border bg-background pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {FEATURED_TOPICS.slice(0, 6).map((topic) => (
            <Button key={topic} type="button" variant="outline"
              onClick={() => { setSearchValue(topic); setActiveSearch(topic); }}
              className="h-8 rounded-full border-border bg-[#eaf1ff] px-3 text-xs font-bold text-primary transition-colors hover:bg-white">
              {topic}
            </Button>
          ))}
        </div>

        <div className="mt-4 max-h-[calc(100vh-20rem)] space-y-3 overflow-auto pr-1">
          {visibleTutors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
              No hay resultados para esta búsqueda.
            </div>
          ) : (
            visibleTutors.slice(0, 10).map((tutor) => {
              const distance = tutor.distance_km != null
                ? tutor.distance_km < 1 ? `${Math.round(tutor.distance_km * 1000)} m` : `${tutor.distance_km.toFixed(1)} km`
                : "Cerca";
              return (
                <div key={tutor.user_id} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <UserAvatar name={tutor.display_name || tutor.full_name || "Tutor"} size="sm" avatarUrl={tutor.avatar_url} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{tutor.display_name || tutor.full_name || "Tutor"}</p>
                        <span className="text-[11px] font-bold text-primary">{distance}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{tutor.bio || buildTutorOccupationLabel(tutor as TutorSearchRecord)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={tutor.distance_km != null ? "h-2 w-2 rounded-full bg-green-500" : "h-2 w-2 rounded-full bg-gray-300"} />
                        <Link href={`/profile/${tutor.user_id}`} className="text-xs font-bold text-primary hover:text-[#172554]">
                          Ver perfil
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <div className="absolute left-4 right-4 top-4 z-20 rounded-2xl bg-[#0f172a]/95 p-4 text-white shadow-[0_18px_40px_rgba(15,23,42,0.24)]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
              <Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") setActiveSearch(searchValue.trim()); }}
                placeholder="Busca por materia, tutor o especialidad"
                className="h-11 rounded-lg border border-white/10 bg-white/10 pl-9 text-white placeholder:text-white/55 focus:border-primary focus:bg-white/12" />
            </div>
            <div className="flex flex-wrap gap-2">
              {categoryPills.map((pill) => (
                <Button key={pill} type="button" variant="outline" onClick={() => setActiveSearch(pill)}
                  className="h-8 rounded-full border-primary bg-[#eaf1ff] px-3 text-xs font-bold text-primary">
                  {pill}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="h-full min-h-144 bg-background pt-24">
          <MapboxMap topicFilter={activeSearch} searchResults={visibleTutors}
            onTutorsFound={(nextTutors, phase) => { setMapTutors(nextTutors); setMapPhase(phase); }} />
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-20 rounded-2xl border border-border bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                {mapPhase === "found" ? `${mapTutors.length} tutores cerca` : mapPhase === "searching" ? "Buscando tutores" : "Resultados en vivo"}
              </p>
              <p className="text-xs text-muted-foreground">En radio de 5 km · sincronizado con el mapa</p>
            </div>
            <div className="flex -space-x-2">
              {visibleTutors.slice(0, 4).map((tutor) => (
                <UserAvatar key={tutor.user_id} name={tutor.display_name || tutor.full_name || "Tutor"} size="sm" avatarUrl={tutor.avatar_url} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
