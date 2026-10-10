"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";

import { UserAvatar } from "@/components/user-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
import { buildTutorOccupationLabel,  type TutorSearchRecord } from "@/lib/tutor-search";
import { useScreenReader } from "@/components/providers/ScreenReaderContext";

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

async function enrichTutor(tutor: Tutor): Promise<Tutor> {
  try {
    const profile = await fetchApi<{ display_name?: string; bio?: string; avatar_url?: string }>(
      `/api/users/profiles/${tutor.user_id}`
    );
    return {
      ...tutor,
      display_name: profile?.display_name || tutor.display_name,
      bio: profile?.bio || tutor.bio,
      avatar_url: profile?.avatar_url || tutor.avatar_url,
    };
  } catch {
    return tutor;
  }
}

const MapboxMap = dynamic(() => import("@/components/map/MapboxMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-full min-h-[calc(100vh-10rem)] w-full rounded-2xl" />,
});

interface ExploreClientProps {
  mapboxAccessToken?: string;
}

export default function ExploreClient({ mapboxAccessToken = "" }: ExploreClientProps) {
  const { speak, stop } = useScreenReader();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  // Distancias calculadas por el mapa (user_id -> km). Solo enriquecen la lista, no deciden qué se muestra.
  const [mapDistances, setMapDistances] = useState<Record<string, number>>({});

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
  const [settledQuery, setSettledQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const query = activeSearch.trim();
    if (!query) {
      setSemanticTutors([]);
      setSearchError(null);
      setSettledQuery("");
      return;
    }

    let active = true;
    setSearchError(null);

    (async () => {
      try {
        // Sin .catch silencioso: un 503 del modelo de embeddings debe verse, no parecer "sin resultados".
        const res = await fetchApi<Tutor[] | TutorsResponse>(
          `/api/tutors/?q=${encodeURIComponent(query)}&limit=50`
        );
        const list = Array.isArray(res) ? res : res?.tutors ?? [];
        // Los resultados semánticos no traen nombre/avatar: se completan desde el perfil de usuario.
        const enriched = await Promise.all(list.map(enrichTutor));
        if (active) setSemanticTutors(enriched);
      } catch (err) {
        if (active) {
          setSemanticTutors([]);
          setSearchError(err instanceof Error ? err.message : "Error en la búsqueda");
        }
      } finally {
        if (active) setSettledQuery(query);
      }
    })();

    return () => {
      active = false;
    };
  }, [activeSearch]);

  // Hay una búsqueda en curso mientras la consulta activa no tenga respuesta todavía.
  const isSearching = activeSearch.trim() !== settledQuery;

  const filteredTutors = useMemo(
    () => (activeSearch.trim() ? semanticTutors : tutors),
    [activeSearch, semanticTutors, tutors]
  );

  // La lista sale SIEMPRE de filteredTutors (lo que respondió el backend); el mapa solo aporta distancias.
  const visibleTutors = useMemo(() => {
    const withDistance = filteredTutors.map((tutor) => ({
      ...tutor,
      distance_km: mapDistances[tutor.user_id] ?? tutor.distance_km,
    }));
    // Con búsqueda activa se conserva el orden por relevancia del backend.
    if (activeSearch.trim()) return withDistance;
    return withDistance.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
  }, [activeSearch, filteredTutors, mapDistances]);

  return (
    <div className="flex h-full min-h-[calc(100vh-7rem)] flex-col gap-4 md:flex-row">
      <aside
          className="flex max-h-72 w-full shrink-0 flex-col rounded-2xl border border-border bg-[#F8FBFF] p-4 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary md:h-[calc(100dvh-10rem)] md:max-h-none md:min-h-[480px] md:w-60"
          tabIndex={0}
          onMouseEnter={() =>
            speak(
              `Sección de resultados en vivo. Hay ${visibleTutors.length} expertos disponibles. La lista se sincroniza con el mapa.`
            )
          }
          onMouseLeave={stop}
          onFocus={() =>
            speak(
              `Sección de resultados en vivo. Hay ${visibleTutors.length} expertos disponibles. La lista se sincroniza con el mapa.`
            )
          }
          onBlur={stop}
        >
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
            aria-label="Buscar experto o materia"
            onFocus={() =>
              speak(
                "Buscador de expertos o materias. Escribe lo que estás buscando y presiona Enter."
              )
            }
            onBlur={stop}
            className="h-10 rounded-lg border-[0.5px] border-border bg-[#ffffff] pl-9 text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white"
          />
        </div>



        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {isSearching ? (<div className="rounded-xl border border-dashed border-border bg-[#ffffff] p-4 text-sm text-muted-foreground">
              Buscando...
            </div>
          ) : searchError ? (
            <div className="rounded-xl border border-dashed border-border bg-[#ffffff] p-4 text-sm text-muted-foreground">
              No pudimos completar la búsqueda. Intenta de nuevo en unos segundos.
            </div>
          ) : visibleTutors.length === 0 ? (
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
                <div
                  key={tutor.user_id}
                  className="rounded-xl border border-border bg-white p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  onMouseEnter={() =>
                    speak(
                      `Experto ${tutor.display_name || tutor.full_name || "sin nombre"}. ` +
                      `${tutor.bio || buildTutorOccupationLabel(tutor as TutorSearchRecord)}. ` +
                      `Distancia: ${distance}.`
                    )
                  }
                  onMouseLeave={stop}
                  onFocus={() =>
                    speak(
                      `Experto ${tutor.display_name || tutor.full_name || "sin nombre"}. ` +
                      `${tutor.bio || buildTutorOccupationLabel(tutor as TutorSearchRecord)}. ` +
                      `Distancia: ${distance}.`
                    )
                  }
                  onBlur={stop}
                >
                  <div className="mt-4 max-h-60 space-y-3 overflow-auto pr-1 md:max-h-[calc(100vh-20rem)]">
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
                        <Link
                          href={`/profile/${tutor.user_id}`}
                          className="text-xs font-bold text-foreground hover:text-primary"
                          onMouseEnter={(event) => {
                            event.stopPropagation();
                            speak(`Botón. Ver perfil de ${tutor.display_name || "este experto"}.`);
                          }}
                          onFocus={(event) => {
                            event.stopPropagation();
                            speak(`Botón. Ver perfil de ${tutor.display_name || "este experto"}.`);
                          }}
                          onMouseLeave={stop}
                          onBlur={stop}
                        >
                          Ver perfil
                        </Link>
                        <Link
                          href={`/messages?userId=${tutor.user_id}`}
                          className="text-xs font-bold text-primary hover:text-brand-hover"
                          onMouseEnter={(event) => {
                            event.stopPropagation();
                            speak(`Botón. Contactar a ${tutor.display_name || "este experto"}.`);
                          }}
                          onFocus={(event) => {
                            event.stopPropagation();
                            speak(`Botón. Contactar a ${tutor.display_name || "este experto"}.`);
                          }}
                          onMouseLeave={stop}
                          onBlur={stop}
                        >
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
        className="relative min-h-[60vh] min-w-0 flex-1 overflow-hidden rounded-2xl border border-border bg-white shadow-sm md:min-h-0"
        style={{ height: "calc(100dvh - 10rem)", minHeight: 480 }}
      >
        <div className="h-full w-full bg-background">
          <MapboxMap
            accessToken={mapboxAccessToken}
            topicFilter={activeSearch}
            searchResults={filteredTutors}
            isSearching={isSearching}
            onTutorsFound={(nextTutors, phase) => {
              if (phase !== 'found') return;
              setMapDistances(
                Object.fromEntries(
                  nextTutors
                    .filter((tutor) => tutor.distance_km != null)
                    .map((tutor) => [tutor.user_id, tutor.distance_km as number])
                )
              );
            }}
          />
        </div>
      </section>
    </div>
  );
}
