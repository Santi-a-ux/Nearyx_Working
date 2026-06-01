"use client";

import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MapGridFallback } from "@/components/map/map-grid-fallback";
import { cn } from "@/lib/utils";
import {
  DEMO_MAP_TUTORS,
  getTutorCoordinates,
  tutorsWithCoordinates,
  type MapTutorPin,
} from "@/lib/map-tutor-coords";

const DEFAULT_CENTER: [number, number] = [-75.52, 5.07];
const DEFAULT_ZOOM = 12.2;

interface MapPreviewProps {
  accessToken: string;
  tutors?: MapTutorPin[];
  className?: string;
  heightClassName?: string;
  showLiveBadge?: boolean;
  useDemoIfEmpty?: boolean;
  maxPins?: number;
  overlayMeta?: string;
}

export function MapPreview({
  accessToken,
  tutors = [],
  className,
  heightClassName = "h-full min-h-[280px]",
  showLiveBadge = false,
  useDemoIfEmpty = false,
  maxPins = 6,
  overlayMeta,
}: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const pins = useMemo(() => {
    const withCoords = tutorsWithCoordinates(tutors);
    if (withCoords.length > 0) return withCoords.slice(0, maxPins);
    if (useDemoIfEmpty) return DEMO_MAP_TUTORS.slice(0, maxPins);
    return [];
  }, [tutors, useDemoIfEmpty, maxPins]);

  const featured = pins[0] ?? tutors[0];
  const overlayTitle =
    featured?.display_name || featured?.full_name
      ? `${featured.display_name || featured.full_name} · ${featured.specialties?.[0] || "Experto"}`
      : "Tu zona · expertos activos";

  const token = accessToken.trim();

  useEffect(() => {
    if (!token || !containerRef.current) return;

    mapboxgl.accessToken = token;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: false,
      attributionControl: false,
      logoPosition: "bottom-right",
    });

    map.dragPan.disable();
    map.scrollZoom.disable();
    map.boxZoom.disable();
    map.dragRotate.disable();
    map.keyboard.disable();
    map.doubleClickZoom.disable();
    map.touchZoomRotate.disable();

    mapRef.current = map;

    map.on("load", () => {
      pins.forEach((tutor) => {
        const el = document.createElement("div");
        el.className = "h-3.5 w-3.5 rounded-full bg-[var(--expert)] ring-4 ring-background shadow-sm";
        const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([tutor.lng, tutor.lat])
          .addTo(map);
        markersRef.current.push(marker);
      });

      if (pins.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds();
        pins.forEach((t) => bounds.extend([t.lng, t.lat]));
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
      } else if (pins.length === 1) {
        map.setCenter([pins[0].lng, pins[0].lat]);
        map.setZoom(13.5);
      }

      map.resize();
    });

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [token, pins]);

  if (!token) {
    return (
      <MapGridFallback
        tutors={pins.length ? pins : tutors}
        className={className}
        showLiveBadge={showLiveBadge}
        overlayTitle={overlayTitle}
        overlayMeta={overlayMeta}
      />
    );
  }

  return (
    <div className={cn("card-elevated relative overflow-hidden p-0", heightClassName, className)}>
      <div ref={containerRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-transparent" />
      {showLiveBadge ? (
        <div className="pointer-events-none absolute left-3 top-3 z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-caption text-foreground shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            En vivo
          </span>
        </div>
      ) : null}
      <div className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-border bg-card/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-label text-muted-foreground">Cerca de ti</div>
            <div className="text-h3 mt-1 truncate">{overlayTitle}</div>
          </div>
          {overlayMeta ? <span className="text-caption shrink-0 text-muted-foreground">{overlayMeta}</span> : null}
        </div>
      </div>
    </div>
  );
}
