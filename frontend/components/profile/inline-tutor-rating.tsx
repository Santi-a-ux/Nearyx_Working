"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyRatingUpdated } from "@/lib/rating-events";

interface InlineTutorRatingProps {
  tutorUserId: string;
}

interface RatingResponse {
  my_rating?: number | null;
  average_rating?: number | null;
  ratings_count?: number;
  error?: string;
  detail?: string;
}

export default function InlineTutorRating({ tutorUserId }: InlineTutorRatingProps) {
  const queryClient = useQueryClient();
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const response = await fetch(`/api/tutors/${tutorUserId}/rating`);
      const data = (await response.json().catch(() => ({}))) as RatingResponse;

      if (mounted && response.ok) {
        setMyRating(data.my_rating ?? null);
        setAverageRating(data.average_rating ?? null);
        setRatingsCount(data.ratings_count ?? 0);
      }
    })().catch(() => {
      // The post author may not be an expert yet; keep the control visible.
    });

    return () => {
      mounted = false;
    };
  }, [tutorUserId]);

  const activeRating = hoveredRating ?? myRating ?? 0;

  const saveRating = async (rating: number) => {
    if (isSaving) {
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
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
      <span className="text-xs font-medium text-muted-foreground">
        Calificar experto:
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={isSaving}
            aria-label={`Calificar ${rating} de 5`}
            className="rounded-full p-0.5 transition-colors hover:bg-muted disabled:opacity-60"
            onMouseEnter={() => setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            onFocus={() => setHoveredRating(rating)}
            onBlur={() => setHoveredRating(null)}
            onClick={() => saveRating(rating)}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                rating <= activeRating ? "fill-amber-400 text-amber-400" : "text-neutral-300"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {averageRating != null ? `${averageRating.toFixed(1)} (${ratingsCount})` : "Sin calificaciones"}
      </span>
    </div>
  );
}
