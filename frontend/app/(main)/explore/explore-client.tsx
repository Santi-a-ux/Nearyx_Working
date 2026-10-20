"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchApi } from "@/lib/api";
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
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

interface ExploreClientProps {
  mapboxAccessToken?: string;
}

export default function ExploreClient({ mapboxAccessToken = "" }: ExploreClientProps) {
  const { speak, stop } = useScreenReader();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetchApi<Tutor[] | TutorsResponse>("/api/tutors/?limit=100").catch(() => [] as Tutor[]);
        const list = Array.isArray(res) ? res : res?.tutors ?? [];
        const enriched = await Promise.all(list.map(enrichTutor));
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

  const isSearching = activeSearch.trim() !== settledQuery;

  const filteredTutors = useMemo(
    () => (activeSearch.trim() ? semanticTutors : tutors),
    [activeSearch, semanticTutors, tutors]
  );

  return (
    <section
      aria-label="Mapa de expertos"
      className="relative -m-4 h-[calc(100dvh-7.5rem)] overflow-hidden bg-background md:h-[calc(100dvh-3.5rem)] lg:-m-6"
    >
      <div className="h-full w-full">
        <MapboxMap
          accessToken={mapboxAccessToken}
          topicFilter={activeSearch}
          searchResults={filteredTutors}
          isSearching={isSearching}
        />
      </div>

      {/* Barra de búsqueda flotante sobre el mapa (deja libre el zoom, arriba a la derecha) */}
      <div className="pointer-events-none absolute left-3 right-14 top-3 z-10 md:left-4 md:right-auto md:top-4 md:w-[min(28rem,calc(100%-6rem))]">
        <form
          role="search"
          className="pointer-events-auto relative"
          onSubmit={(event) => {
            event.preventDefault();
            setActiveSearch(searchValue.trim());
          }}
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(event) => {
              const value = event.target.value;
              setSearchValue(value);
              if (!value.trim()) setActiveSearch("");
            }}
            enterKeyHint="search"
            placeholder="Describe lo que necesitas y encuentra al experto ideal."
            aria-label="Describe lo que necesitas y encuentra al experto ideal."
            onFocus={() =>
              speak("Buscador de expertos o materias. Escribe lo que estás buscando y presiona Enter.")
            }
            onBlur={stop}
            className="h-11 rounded-full border border-border bg-popover pl-10 pr-4 text-popover-foreground shadow-lg placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />
        </form>

        {isSearching || searchError ? (
          <p
            role="status"
            className="pointer-events-auto mt-2 w-fit max-w-full rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          >
            {isSearching
              ? "Buscando..."
              : "No pudimos completar la búsqueda. Intenta de nuevo en unos segundos."}
          </p>
        ) : null}
      </div>
    </section>
  );
}