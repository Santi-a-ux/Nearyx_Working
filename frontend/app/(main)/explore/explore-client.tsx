"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import CompactTutorCard from "@/components/ui/compact-tutor-card";
import { fetchApi } from "@/lib/api";
import { FEATURED_TOPICS } from "@/lib/constants";
import {
  buildTutorOccupationLabel,
  discoverTopicsFromTutors,
  matchesTutorSearch,
  type DiscoveredTopic,
  type TutorSearchRecord,
} from "@/lib/tutor-search";

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
  loading: () => (
    <Skeleton className="flex min-h-125 items-center justify-center rounded-lg">
      Cargando mapa interactivo...
    </Skeleton>
  ),
});

export default function ExploreClient() {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [dynamicTopics, setDynamicTopics] = useState<DiscoveredTopic[]>([]);
  const [mapTutors, setMapTutors] = useState<Tutor[]>([]);
  const [mapPhase, setMapPhase] = useState<'searching' | 'found' | 'empty' | 'idle'>('idle');
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") ?? "";
  const [searchTopic, setSearchTopic] = useState(initialTopic);
  const [activeSearch, setActiveSearch] = useState(initialTopic);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetchApi<Tutor[] | TutorsResponse>("/api/tutors/?limit=100").catch(() => [] as Tutor[]);
        const list = Array.isArray(res) ? res : res?.tutors ?? [];
        const enriched = await Promise.all(
          list.map(async (tutor) => {
            const profile = await fetchApi<{ display_name?: string; bio?: string; avatar_url?: string }>(`/api/users/profiles/${tutor.user_id}`).catch(() => null);

            return {
              ...tutor,
              display_name: profile?.display_name || tutor.display_name,
              bio: profile?.bio || tutor.bio,
              avatar_url: profile?.avatar_url || tutor.avatar_url,
            };
          })
        );

        if (mounted) {
          setTutors(enriched);
          try {
            const discovered = discoverTopicsFromTutors(enriched as TutorSearchRecord[], 14);
            setDynamicTopics(discovered);
          } catch {
            // ignore discovery errors
          }
        }
      } catch {
        // ignore
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleTutors = useMemo(() => {
    if (mapPhase === 'found' && mapTutors.length > 0) {
      return mapTutors;
    }

    return tutors.filter((tutor) => matchesTutorSearch(tutor as TutorSearchRecord, activeSearch));
  }, [activeSearch, mapPhase, mapTutors, tutors]);

  const suggestionPool = useMemo(() => {
    const topicSource = dynamicTopics.length > 0
      ? dynamicTopics.map((topic) => ({ token: topic.token, label: topic.label, count: topic.count, emoji: getCategoryEmoji(topic.label) }))
      : FEATURED_TOPICS.map((topic) => ({ token: topic.toLowerCase(), label: topic, count: 0, emoji: getCategoryEmoji(topic) }));

    const query = searchTopic.trim().toLowerCase();

    return topicSource
      .filter((item) => !query || item.label.toLowerCase().includes(query) || item.token.includes(query))
      .slice(0, 8);
  }, [dynamicTopics, searchTopic]);

  const chipTopics = useMemo(() => {
    return (dynamicTopics.length === 0 ? FEATURED_TOPICS.map((tag) => ({ token: tag.toLowerCase(), label: tag, count: 0, emoji: getCategoryEmoji(tag) })) : dynamicTopics.map((topic) => ({ ...topic, emoji: getCategoryEmoji(topic.label) }))).slice(0, 8);
  }, [dynamicTopics]);

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#38240D', fontFamily: 'var(--font-main)', fontWeight: 700 }}>Explorar</h1>
        <p className="max-w-2xl" style={{ color: 'rgba(56, 36, 13, 0.60)', fontFamily: 'var(--font-main)' }}>
          Busca desde tu ubicación real, descubre temas sugeridos por tutores activos y sigue el mapa mientras amplía el radio automáticamente.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <aside className="hidden w-85 shrink-0 overflow-hidden rounded-3xl border border-white/8 bg-[#0b0b14]/90 p-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl md:flex md:flex-col">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/80">Resultados en vivo</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Tutores cerca de ti</h3>
            <p className="mt-1 text-sm text-white/45">
              {activeSearch ? `Filtrando por ${activeSearch}` : 'La lista se sincroniza con lo que el mapa encuentra.'}
            </p>
          </div>

          <div className="space-y-2 overflow-auto pr-1">
            {visibleTutors.length === 0 ? (
              <Skeleton className="h-24 w-full rounded-2xl" />
            ) : (
              visibleTutors.slice(0, 20).map((tutor) => (
                <CompactTutorCard
                  key={tutor.id || tutor.user_id}
                  user_id={tutor.user_id}
                  name={tutor.display_name || tutor.full_name}
                  specialty={buildTutorOccupationLabel(tutor as TutorSearchRecord)}
                  avatar_url={tutor.avatar_url}
                  distance_km={tutor.distance_km}
                />
              ))
            )}
          </div>
        </aside>

        <div className="relative min-h-190 flex-1 overflow-hidden rounded-[2rem] border border-white/8 bg-[#07070d] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
          <div className="absolute left-1/2 top-5 z-30 w-[min(760px,calc(100%-1.5rem))] -translate-x-1/2">
            <div className="rounded-[1.4rem] border border-white/10 bg-[#11111d]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex items-center gap-3 rounded-[1rem] border border-white/8 bg-black/20 px-4 py-3">
                <span className="text-lg">🔎</span>
                <input
                  value={searchTopic}
                  onChange={(event) => {
                    setSearchTopic(event.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      setActiveSearch(searchTopic.trim());
                      setSuggestionsOpen(false);
                    }
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
                  className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                  placeholder="¿Qué quieres aprender? Matemáticas, guitarra, inglés, programación..."
                />
                <button
                  onClick={() => {
                    setActiveSearch(searchTopic.trim());
                    setSuggestionsOpen(false);
                  }}
                  className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Buscar
                </button>
              </div>

              {suggestionsOpen && suggestionPool.length > 0 && (
                <div className="mt-3 rounded-[1rem] border border-white/8 bg-[#0a0a12] p-2 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
                  <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                    Sugerencias reales
                  </p>
                  <div className="grid gap-1">
                    {suggestionPool.map((item) => (
                      <button
                        key={item.token}
                        onMouseDown={() => {
                          setSearchTopic(item.token);
                          setActiveSearch(item.token);
                          setSuggestionsOpen(false);
                        }}
                        className="flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-white/85 transition-colors hover:bg-white/6"
                      >
                        <span className="flex items-center gap-2">
                          <span>{item.emoji}</span>
                          <span>{item.label}</span>
                        </span>
                        <span className="text-xs text-white/35">{item.count > 0 ? `${item.count} tutores` : 'Tema'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {chipTopics.map((topic) => (
                  <button
                    key={topic.token}
                    onClick={() => {
                      setSearchTopic(topic.token);
                      setActiveSearch(topic.token);
                    }}
                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${activeSearch === topic.token ? 'bg-primary text-primary-foreground' : 'bg-white/8 text-white/70 hover:bg-white/14'}`}
                  >
                    <span>{topic.emoji}</span>
                    <span>{topic.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <MapboxMap
            topicFilter={activeSearch}
            searchResults={visibleTutors}
            onTutorsFound={(nextTutors, phase) => {
              setMapTutors(nextTutors);
              setMapPhase(phase);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function getCategoryEmoji(label: string) {
  const value = label.toLowerCase();
  if (value.includes('mecanic') || value.includes('automotriz') || value.includes('carro') || value.includes('auto')) return '🔧';
  if (value.includes('conduc') || value.includes('manej') || value.includes('licencia')) return '🚗';
  if (value.includes('mat')) return '📐';
  if (value.includes('ingl') || value.includes('idioma')) return '🗣️';
  if (value.includes('program') || value.includes('code') || value.includes('python') || value.includes('django') || value.includes('fastapi') || value.includes('dato')) return '💻';
  if (value.includes('mus') || value.includes('guit')) return '🎸';
  if (value.includes('cien') || value.includes('biol')) return '🔬';
  if (value.includes('econ') || value.includes('finan')) return '📊';
  if (value.includes('hist') || value.includes('social')) return '📚';
  if (value.includes('arte') || value.includes('dibu')) return '🎨';
  if (value.includes('cocina') || value.includes('gastronomía') || value.includes('repostería')) return '👨‍🍳';
  if (value.includes('yoga') || value.includes('meditación') || value.includes('salud') || value.includes('bienestar')) return '🧘';
  if (value.includes('fotografía') || value.includes('edición') || value.includes('imagen')) return '📷';
  if (value.includes('profesional')) return '💼';
  return '✨';
}
