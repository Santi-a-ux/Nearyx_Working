"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { buildTutorOccupationLabel,  type TutorSearchRecord } from "@/lib/tutor-search";

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
  loading: () => <Skeleton className="h-full min-h-[calc(100vh-10rem)] w-full rounded-2xl" />,
});

interface ExploreClientProps {
  mapboxAccessToken?: string;
}

export default function ExploreClient({ mapboxAccessToken = "" }: ExploreClientProps) {
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
              return {
                ...tutor,
                display_name: profile?.display_name || tutor.display_name,
                bio: profile?.bio || tutor.bio,
                avatar_url: profile?.avatar_url || tutor.avatar_url,
              };
            } catch {
              return tutor;
            }
          })
        );

        if (active) setTutors(enriched);
      } catch {
        if (active) setTutors([]);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const [semanticTutors, setSemanticTutors] = useState<Tutor[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const query = activeSearch.trim();
    if (!query) {
      setSemanticTutors([]);
      return;
    }

    let active = true;
    setIsSearching(true);

    (async () => {
      try {
        const res = await fetchApi<Tutor[] | TutorsResponse>(
          `/api/tutors/?q=${encodeURIComponent(query)}&limit=50`
        ).catch(() => [] as Tutor[]);
        const list = Array.isArray(res) ? res : res?.tutors ?? [];
        if (active) setSemanticTutors(list);
      } finally {
        if (active) setIsSearching(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeSearch]);

  const filteredTutors = activeSearch.trim() ? semanticTutors : tutors;

  const visibleTutors = mapPhase === 'found' && mapTutors.length > 0 ? mapTutors : filteredTutors;

  return (
    <div className="flex h-full min-h-[calc(100vh-7rem)] gap-4">
      <aside className="w-60 shrink-0 rounded-2xl border border-border bg-[#F8FBFF] p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Resultados en vivo</p>
        <h2 className="mt-2 text-lg font-bold text-foreground">Expertos cerca de ti</h2>
        <p className="mt-1 text-sm text-muted-foreground">La lista se sincroniza con el mapa.</p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") setActiveSearch(searchValue.trim());
            }}
            placeholder="Buscar experto o materia"
            className="h-10 rounded-lg border-[0.5px] border-border bg-[#ffffff] pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white"
          />
        </div>


        <div className="mt-4 max-h-[calc(100vh-20rem)] space-y-3 overflow-auto pr-1">
        {isSearching ? (<div className="rounded-xl border border-dashed border-border bg-[#ffffff] p-4 text-sm text-muted-foreground">
              Buscando...
            </div>
          ): visibleTutors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-[#ffffff] p-4 text-sm text-muted-foreground">
              No hay resultados para esta búsqueda.
            </div>
          ) : (
            visibleTutors.slice(0, 10).map((tutor) => {
              const distance = tutor.distance_km != null
                ? tutor.distance_km < 1
                  ? `${Math.round(tutor.distance_km * 1000)} m`
                  : `${tutor.distance_km.toFixed(1)} km`
                : "Cerca";

              return (
                <div key={tutor.user_id} className="rounded-xl border border-border bg-white p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      name={tutor.display_name || tutor.full_name || "Experto"}
                      size="sm"
                      avatarUrl={tutor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">{tutor.display_name || tutor.full_name || "Experto"}</p>
                        <span className="text-[11px] font-bold text-primary">{distance}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{tutor.bio || buildTutorOccupationLabel(tutor as TutorSearchRecord)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={tutor.distance_km != null ? "h-2 w-2 rounded-full bg-semantic-success" : "h-2 w-2 rounded-full bg-neutral-400"} />
                        <Link href={`/profile/${tutor.user_id}`} className="text-xs font-bold text-foreground hover:text-primary">
                          Ver perfil
                        </Link>
                        <Link href={`/messages?userId=${tutor.user_id}`} className="text-xs font-bold text-primary hover:text-brand-hover">
                          Contactar
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

      <section
        className="relative min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-sm"
        style={{ height: "calc(100vh - 10rem)", minHeight: 480 }}
      >
        <div className="h-full w-full bg-background">
          <MapboxMap
            accessToken={mapboxAccessToken}
            topicFilter={activeSearch}
            searchResults={visibleTutors}
            onTutorsFound={(nextTutors, phase) => {
              setMapTutors(nextTutors);
              setMapPhase(phase);
            }}
          />
        </div>
      </section>
    </div>
  );
}
