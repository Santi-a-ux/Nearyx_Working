"use client";

import { cn } from "@/lib/utils";
import type { MapTutorPin } from "@/lib/map-tutor-coords";
import { tutorsWithCoordinates } from "@/lib/map-tutor-coords";

interface MapGridFallbackProps {
  tutors: MapTutorPin[];
  className?: string;
  showLiveBadge?: boolean;
  overlayTitle?: string;
  overlayMeta?: string;
}

const PIN_POSITIONS = [
  { top: "22%", left: "30%", expert: true },
  { top: "40%", left: "60%", expert: true },
  { top: "62%", left: "38%", expert: false },
  { top: "55%", left: "78%", expert: true },
  { top: "30%", left: "70%", expert: false },
];

export function MapGridFallback({
  tutors,
  className,
  showLiveBadge,
  overlayTitle,
  overlayMeta,
}: MapGridFallbackProps) {
  const featured = tutorsWithCoordinates(tutors)[0] ?? tutors[0];
  const title =
    overlayTitle ??
    (featured?.display_name || featured?.full_name
      ? `${featured.display_name || featured.full_name} · ${featured.specialties?.[0] || "Experto"}`
      : "Expertos cerca de ti");

  return (
    <div className={cn("card-elevated relative aspect-[5/4] overflow-hidden bg-card p-0", className)}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.55,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-accent/35" />
      {PIN_POSITIONS.map((p, i) => (
        <span
          key={i}
          className={cn(
            "absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-background",
            p.expert ? "bg-[var(--expert)]" : "bg-[var(--student)]",
          )}
          style={{ top: p.top, left: p.left }}
        />
      ))}
      {showLiveBadge ? (
        <div className="absolute left-3 top-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-caption text-foreground shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            En vivo
          </span>
        </div>
      ) : null}
      <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-border bg-card/95 p-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-label text-muted-foreground">Cerca de ti</div>
            <div className="text-h3 mt-1 truncate">{title}</div>
          </div>
          {overlayMeta ? <span className="text-caption shrink-0 text-muted-foreground">{overlayMeta}</span> : null}
        </div>
      </div>
    </div>
  );
}
