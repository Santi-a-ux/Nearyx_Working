'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchApi } from '@/lib/api';
import { isValidMapboxToken, pickMapboxToken } from '@/lib/mapbox-env';


interface Tutor {
  id?: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  specialties?: string[];
  categories?: string[];
  hourly_rate?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  avatar_url?: string;
  distance_km?: number;
}

interface TutorsResponse {
  tutors?: Tutor[];
}

interface MapboxMapProps {
  accessToken?: string;
  topicFilter?: string;
  searchResults?: Tutor[];
  onTutorsFound?: (tutors: Tutor[], phase: 'searching' | 'found' | 'empty') => void;
}

const MAP_HEIGHT = 'calc(100vh - 10rem)';
const MAP_MIN_HEIGHT = 480;

const RADII = [2, 5, 10, 20, 50];
const DEFAULT_CENTER: [number, number] = [-75.52, 5.07];
const KM_TO_METERS = 1000;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapboxMap({ accessToken = '', topicFilter, searchResults, onTutorsFound }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const userLocationRef = useRef<[number, number]>(DEFAULT_CENTER);
  const searchTutorsRef = useRef<(center: [number, number]) => Promise<void>>(async () => {});
  const searchRunIdRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);

  const [searchPhase, setSearchPhase] = useState<'idle' | 'searching' | 'found' | 'empty'>('idle');
  const [foundTutors, setFoundTutors] = useState<Tutor[]>([]);
  const [currentRadius, setCurrentRadius] = useState(0);
  const initialToken = pickMapboxToken(accessToken, process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
  const [resolvedToken, setResolvedToken] = useState(initialToken);
  const [tokenStatus, setTokenStatus] = useState<'loading' | 'ready' | 'missing'>(
    initialToken ? 'ready' : 'loading'
  );

  const hasMapboxToken = isValidMapboxToken(resolvedToken);

  useEffect(() => {
    const immediate = pickMapboxToken(accessToken, process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
    if (immediate) {
      setResolvedToken(immediate);
      setTokenStatus('ready');
      return;
    }

    let cancelled = false;
    setTokenStatus('loading');

    void fetch('/api/config/public')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { mapboxToken?: string } | null) => {
        if (cancelled) return;
        const token = pickMapboxToken(data?.mapboxToken, process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
        if (token) {
          setResolvedToken(token);
          setTokenStatus('ready');
        } else {
          setTokenStatus('missing');
        }
      })
      .catch(() => {
        if (!cancelled) setTokenStatus('missing');
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  };

  const clearUserMarker = () => {
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
  };

  const clearRadiusSource = () => {
    if (!map.current) return;
    if (map.current.getLayer('search-radius-line')) map.current.removeLayer('search-radius-line');
    if (map.current.getLayer('search-radius-fill')) map.current.removeLayer('search-radius-fill');
    if (map.current.getSource('search-radius')) map.current.removeSource('search-radius');
  };

  const addUserMarker = (center: [number, number]) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = 'relative flex items-center justify-center';
    el.style.cssText = 'width:80px;height:80px;pointer-events:none;';
    el.innerHTML = `
      <div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
        <div class="radar-ring" style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(108,99,255,0.25);border:1.5px solid rgba(108,99,255,0.4);"></div>
        <div class="radar-ring-2" style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(108,99,255,0.15);border:1px solid rgba(108,99,255,0.3);"></div>
        <div class="radar-ring-3" style="position:absolute;width:28px;height:28px;border-radius:50%;background:rgba(108,99,255,0.1);"></div>
        <div class="user-dot" style="position:relative;z-index:10;width:16px;height:16px;border-radius:50%;background:#6C63FF;border:3px solid white;box-shadow:0 0 0 2px rgba(108,99,255,0.4),0 4px 12px rgba(108,99,255,0.5);"></div>
      </div>
    `;

    userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(center)
      .addTo(map.current);
  };

  const addStaticUserMarker = (center: [number, number]) => {
    if (!map.current) return;

    const el = document.createElement('div');
    el.style.cssText = `
      width:18px;height:18px;border-radius:50%;
      background:#6C63FF;border:3px solid white;
      box-shadow:0 0 0 2px rgba(108,99,255,0.3), 0 4px 12px rgba(108,99,255,0.4);
    `;

    userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(center)
      .addTo(map.current);
  };

  const updateRadiusSource = (center: [number, number], radiusKm: number) => {
    if (!map.current) return;

    const points = 64;
    const coords: [number, number][] = [];
    const distanceX = radiusKm / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    const distanceY = radiusKm / 110.574;

    for (let i = 0; i < points; i++) {
      const angle = (i / points) * (2 * Math.PI);
      coords.push([
        center[0] + distanceX * Math.cos(angle),
        center[1] + distanceY * Math.sin(angle),
      ]);
    }
    coords.push(coords[0]);

    const geojson: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [coords] },
      properties: {},
    };

    if (map.current.getSource('search-radius')) {
      (map.current.getSource('search-radius') as mapboxgl.GeoJSONSource).setData(geojson);
      return;
    }

    map.current.addSource('search-radius', { type: 'geojson', data: geojson });
    map.current.addLayer({
      id: 'search-radius-fill',
      type: 'fill',
      source: 'search-radius',
      paint: { 'fill-color': '#6C63FF', 'fill-opacity': 0.12 },
    });
    map.current.addLayer({
      id: 'search-radius-line',
      type: 'line',
      source: 'search-radius',
      paint: {
        'line-color': '#6C63FF',
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
  };

  const decorateTutors = (list: Tutor[], center: [number, number]) => {
    return list
      .filter((tutor) => {
        const lat = tutor.lat ?? tutor.latitude;
        const lng = tutor.lng ?? tutor.longitude;
        return typeof lat === 'number' && typeof lng === 'number';
      })
      .map((tutor) => {
        const lat = (tutor.lat ?? tutor.latitude) as number;
        const lng = (tutor.lng ?? tutor.longitude) as number;
        return {
          ...tutor,
          distance_km: haversineKm(center[1], center[0], lat, lng),
        };
      })
      .sort((a, b) => (a.distance_km ?? 99) - (b.distance_km ?? 99));
  };

  const renderMarkers = (tutors: Tutor[]) => {
    clearMarkers();

    tutors.forEach((tutor) => {
      const lat = (tutor.lat ?? tutor.latitude) as number;
      const lng = (tutor.lng ?? tutor.longitude) as number;
      const name = tutor.display_name ?? tutor.full_name ?? 'Perfil disponible';
      const avatar = tutor.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`;
      const dist = tutor.distance_km;
      const distLabel = dist != null ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : '';

      const el = document.createElement('div');
      el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.25));';
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:3px;">
          <div style="width:44px;height:44px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px rgba(198,226,254,0.55),0 8px 20px rgba(37,99,235,0.22);background-image:url('${avatar}');background-size:cover;background-position:center;position:relative;">
            <div style="position:absolute;bottom:1px;right:1px;width:10px;height:10px;background:#34d399;border-radius:50%;border:2px solid white;"></div>
          </div>
          ${distLabel ? `<div style="background:white;color:#6C63FF;font-size:10px;font-weight:700;padding:2px 6px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,0.15);white-space:nowrap;font-family:sans-serif;">📍 ${distLabel}</div>` : ''}
          <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid white;margin-top:-3px;"></div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 60, closeButton: false, maxWidth: '220px' }).setHTML(`
        <div style="padding:12px;font-family:'Poppins', sans-serif;min-width:200px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <img src="${avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid white;box-shadow:0 0 0 2px rgba(198,226,254,0.55),0 6px 16px rgba(37,99,235,0.18)" />
            <div>
              <strong style="font-size:13px;color:#111;display:block">${name}</strong>
              ${distLabel ? `<span style="font-size:11px;color:#6C63FF;font-weight:600">📍 A ${distLabel} de ti</span>` : ''}
            </div>
          </div>
          <p style="font-size:11px;color:#666;margin:6px 0">${tutor.specialties?.slice(0, 2).join(' · ') ?? 'Experto'}</p>
          <div style="font-size:12px;color:#111;font-weight:600;margin-bottom:10px">$${tutor.hourly_rate ?? 20}/hr</div>
          <div style="display:flex;gap:6px">
            <a href="/profile/${tutor.user_id}" style="flex:1;text-align:center;padding:6px;border:1px solid #e5e7eb;border-radius:8px;font-size:11px;text-decoration:none;color:#374151;font-weight:500">Ver perfil</a>
            <a href="/messages?userId=${tutor.user_id}" style="flex:1;text-align:center;padding:6px;background:#2563EB;color:white;border-radius:8px;font-size:11px;text-decoration:none;font-weight:600">Contactar</a>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  };

  const searchTutors = useCallback(async (center: [number, number]) => {
    const runId = ++searchRunIdRef.current;
    setSearchPhase('searching');
    onTutorsFound?.([], 'searching');
    setCurrentRadius(0);
    clearRadiusSource();
    clearMarkers();
    clearUserMarker();
    addUserMarker(center);

    try {
      const localMatches = searchResults?.filter((tutor) => {
        const lat = tutor.lat ?? tutor.latitude;
        const lng = tutor.lng ?? tutor.longitude;
        return typeof lat === 'number' && typeof lng === 'number';
      }) ?? [];

      if (localMatches.length > 0) {
        const enrichedLocal = decorateTutors(localMatches, center);
        if (runId !== searchRunIdRef.current) return;
        renderMarkers(enrichedLocal);
        setFoundTutors(enrichedLocal);
        setSearchPhase('found');
        onTutorsFound?.(enrichedLocal, 'found');
        addStaticUserMarker(center);
        return;
      }

      for (const radius of RADII) {
        if (runId !== searchRunIdRef.current) return;

        setCurrentRadius(radius);
        updateRadiusSource(center, radius);

        const radiusMeters = radius * KM_TO_METERS;
        const res = await fetchApi<TutorsResponse | Tutor[]>(`/api/tutors/?lat=${center[1]}&lng=${center[0]}&radius=${radiusMeters}&limit=50`);
        const list: Tutor[] = Array.isArray(res) ? res : (res as TutorsResponse).tutors ?? [];
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

        const withCoords = decorateTutors(enriched, center);

        if (withCoords.length >= 1) {
          if (runId !== searchRunIdRef.current) return;
          renderMarkers(withCoords);
          setFoundTutors(withCoords);
          setSearchPhase('found');
          onTutorsFound?.(withCoords, 'found');
          clearUserMarker();
          addStaticUserMarker(center);
          return;
        }
      }

      setFoundTutors([]);
      setSearchPhase('empty');
      onTutorsFound?.([], 'empty');
      clearUserMarker();
      addStaticUserMarker(center);
    } catch {
      setFoundTutors([]);
      setSearchPhase('empty');
      onTutorsFound?.([], 'empty');
      clearUserMarker();
      addStaticUserMarker(center);
    }
  }, [onTutorsFound, searchResults, topicFilter]);

  useEffect(() => {
    searchTutorsRef.current = searchTutors;
  }, [searchTutors]);

  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    void searchTutorsRef.current(userLocationRef.current);
  }, [topicFilter]);

  useEffect(() => {
    if (!hasMapboxToken || map.current || !mapContainer.current) return;

    mapboxgl.accessToken = resolvedToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: DEFAULT_CENTER,
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    const resizeMap = () => {
      map.current?.resize();
    };

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' && mapContainer.current
        ? new ResizeObserver(resizeMap)
        : null;
    resizeObserver?.observe(mapContainer.current);

    map.current.on('load', () => {
      resizeMap();

      if (navigator.geolocation) {
        const onPosition = ({ coords }: GeolocationPosition) => {
          const center: [number, number] = [coords.longitude, coords.latitude];
          userLocationRef.current = center;
          clearUserMarker();
          addUserMarker(center);
          map.current?.flyTo({ center, zoom: 13, duration: 1200 });
          void searchTutorsRef.current(center);
        };

        navigator.geolocation.getCurrentPosition(
          onPosition,
          () => {
            clearUserMarker();
            addUserMarker(DEFAULT_CENTER);
            void searchTutorsRef.current(DEFAULT_CENTER);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );

        watchIdRef.current = navigator.geolocation.watchPosition(
          onPosition,
          () => {
            // keep last valid location
          },
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 12000 }
        );
      } else {
        clearUserMarker();
        addUserMarker(DEFAULT_CENTER);
        void searchTutorsRef.current(DEFAULT_CENTER);
      }
    });

    return () => {
      resizeObserver?.disconnect();
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      clearMarkers();
      clearUserMarker();
      clearRadiusSource();
      map.current?.remove();
      map.current = null;
    };
  }, [hasMapboxToken, resolvedToken]);

  if (tokenStatus === 'loading') {
    return (
      <div
        className="relative w-full animate-pulse overflow-hidden rounded-lg bg-slate-100"
        style={{ height: MAP_HEIGHT, minHeight: MAP_MIN_HEIGHT }}
      />
    );
  }

  if (!hasMapboxToken) {
    return (
      <div
        className="relative w-full overflow-hidden rounded-lg bg-slate-200"
        style={{ height: MAP_HEIGHT, minHeight: MAP_MIN_HEIGHT }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.72),transparent_40%)]" />
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
          <div className="max-w-md rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Mapa temporalmente desactivado</p>
            <h3 className="mt-3 text-xl font-bold text-slate-900">Falta configurar el token de Mapbox</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              En la raíz del proyecto, define{' '}
              <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token</code>{' '}
              en <code className="rounded bg-slate-100 px-1">.env</code> y reconstruye el frontend:{' '}
              <code className="rounded bg-slate-100 px-1">docker compose build frontend --no-cache</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full"
      style={{ height: MAP_HEIGHT, minHeight: MAP_MIN_HEIGHT }}
    >
      <div ref={mapContainer} className="mapbox-host h-full w-full rounded-lg" />

      {searchPhase !== 'idle' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 transition-all duration-500 ease-out">
          <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur-xl dark:bg-[#13132a]/95">
            {searchPhase === 'searching' && (
              <div className="flex gap-1 p-3 pb-0">
                {RADII.map((r) => (
                  <div key={r} className="h-1 flex-1 overflow-hidden rounded-full bg-black/5">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: currentRadius >= r ? '100%' : '0%' }} />
                  </div>
                ))}
              </div>
            )}

            <div className="p-4">
              {searchPhase === 'searching' && (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-base font-bold text-gray-900 dark:text-white">
                      Buscando expertos{topicFilter ? ` de ${topicFilter}` : ''}...
                    </p>
                    <p className="mt-0.5 text-sm text-gray-400">Radio actual: {currentRadius} km</p>
                  </div>
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 w-9 animate-pulse rounded-full border-2 border-white bg-linear-to-br from-primary/20 to-primary/10" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {searchPhase === 'found' && (
                <>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {foundTutors.length} experto{foundTutors.length !== 1 ? 's' : ''}{topicFilter ? ` de ${topicFilter}` : ''} cerca
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">En un radio de {currentRadius} km</p>
                    </div>
                    <div className="flex -space-x-2">
                      {foundTutors.slice(0, 4).map((tutor) => (
                        <img
                          key={tutor.user_id}
                          src={tutor.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`}
                          className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-[0_6px_16px_rgba(37,99,235,0.12)] ring-2 ring-[#C6E2FE]/50"
                          alt=""
                        />
                      ))}
                      {foundTutors.length > 4 && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#EEF6FF] text-xs font-bold text-[#2563EB] shadow-[0_6px_16px_rgba(37,99,235,0.12)] ring-2 ring-[#C6E2FE]/50">
                          +{foundTutors.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
                    {foundTutors.slice(0, 6).map((tutor) => (
                      <TutorMiniCard key={tutor.user_id} tutor={tutor} />
                    ))}
                  </div>
                </>
              )}

              {searchPhase === 'empty' && (
                <div className="py-2 text-center">
                  <p className="font-semibold text-gray-700 dark:text-white/70">No encontramos expertos en tu zona</p>
                  <p className="mt-1 text-sm text-gray-400">Buscamos hasta {currentRadius} km</p>
                  <button onClick={() => searchTutorsRef.current(userLocationRef.current)} className="mt-3 text-sm font-medium text-primary hover:underline">Buscar de nuevo</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface TutorMiniCardProps {
  tutor: Tutor;
}

function TutorMiniCard({ tutor }: TutorMiniCardProps) {
  const dist = tutor.distance_km;
  const distLabel = dist != null ? (dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`) : null;

  return (
    <Link href={`/profile/${tutor.user_id}`} className="shrink-0 flex w-18 flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors hover:bg-black/5">
      <div className="relative">
        <img
          src={tutor.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`}
          className="h-12 w-12 border-2 border-white object-cover shadow-[0_8px_20px_rgba(37,99,235,0.12)] ring-2 ring-[#C6E2FE]/50 rounded-full"
          alt=""
        />
        <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#C6E2FE] bg-emerald-400" />
      </div>
      <p className="w-full truncate text-xs font-medium leading-tight text-gray-800 dark:text-white/80">{(tutor.display_name ?? tutor.full_name ?? 'Perfil').split(' ')[0]}</p>
      {distLabel && <p className="-mt-0.5 text-xs font-semibold text-primary">{distLabel}</p>}
    </Link>
  );
}
