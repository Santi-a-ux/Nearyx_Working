"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { notifyRatingUpdated } from "@/lib/rating-events";

interface TutorRatingProps {
  tutorUserId: string;
  initialAverage?: number | null;
  initialCount?: number;
}

interface RatingResponse {
  my_rating?: number | null;
  average_rating?: number | null;
  ratings_count?: number;
  error?: string;
  detail?: string;
}

export default function TutorRating({ tutorUserId, initialAverage, initialCount = 0 }: TutorRatingProps) {
  const queryClient = useQueryClient();
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(initialAverage ?? null);
  const [ratingsCount, setRatingsCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canRate, setCanRate] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch(`/api/tutors/${tutorUserId}/rating`);
        if (response.status === 401) {
          if (mounted) {
            setCanRate(false);
          }
          return;
        }

        const data = (await response.json().catch(() => ({}))) as RatingResponse;
        if (!response.ok) {
          throw new Error(data.detail || data.error || "No se pudo cargar tu calificacion");
        }

        if (mounted) {
          setMyRating(data.my_rating ?? null);
          setAverageRating(data.average_rating ?? null);
          setRatingsCount(data.ratings_count ?? 0);
        }
      } catch {
        if (mounted) {
          setCanRate(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [tutorUserId]);

  const activeRating = hoveredRating ?? myRating ?? 0;
  const ratingLabel = useMemo(() => {
    if (!ratingsCount || averageRating == null) {
      return "Sin valoraciones todavia";
    }

    return `${averageRating.toFixed(1)} de 5 (${ratingsCount} ${ratingsCount === 1 ? "valoracion" : "valoraciones"})`;
  }, [averageRating, ratingsCount]);

  const saveRating = async (rating: number) => {
    if (!canRate || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/tutors/${tutorUserId}/rating`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });
      const data = (await response.json().catch(() => ({}))) as RatingResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No se pudo guardar la calificacion");
      }

      setMyRating(data.my_rating ?? rating);
      setAverageRating(data.average_rating ?? null);
      setRatingsCount(data.ratings_count ?? 0);
      await queryClient.invalidateQueries({ queryKey: ["dashboard-tutors"] });
      notifyRatingUpdated();
      toast.success("Calificacion guardada");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "No se pudo guardar la calificacion");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "rgba(56, 36, 13, 0.18)" }}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#38240D", fontFamily: "var(--font-main)" }}>
            Califica tu experiencia
          </h3>
          <p className="mt-1 text-sm" style={{ color: "rgba(56, 36, 13, 0.60)", fontFamily: "var(--font-main)" }}>
            {ratingLabel}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <Button
              key={rating}
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-amber-50"
              disabled={!canRate || isSaving || isLoading}
              aria-label={`Calificar ${rating} de 5`}
              onMouseEnter={() => setHoveredRating(rating)}
              onMouseLeave={() => setHoveredRating(null)}
              onFocus={() => setHoveredRating(rating)}
              onBlur={() => setHoveredRating(null)}
              onClick={() => saveRating(rating)}
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  rating <= activeRating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                }`}
              />
            </Button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs" style={{ color: "rgba(56, 36, 13, 0.50)", fontFamily: "var(--font-main)" }}>
        {canRate
          ? myRating
            ? `Tu calificacion actual es ${myRating} de 5. Puedes cambiarla cuando quieras.`
            : "Selecciona una estrella para guardar tu calificacion."
          : "Inicia sesion para calificar a este experto."}
      </p>
    </div>
  );
}
