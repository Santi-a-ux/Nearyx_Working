"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { notifyRatingUpdated } from "@/lib/rating-events";

interface InlineTutorRatingProps {
  tutorUserId: string;
}

interface Review {
  rating: number;
  comment?: string | null;
  rater_user_id: string;
  created_at: string;
  updated_at: string;
}

interface RatingResponse {
  my_rating?: number | null;
  my_comment?: string | null;
  average_rating?: number | null;
  ratings_count?: number;
  reviews?: Review[];
  error?: string;
  detail?: string;
}

export default function InlineTutorRating({ tutorUserId }: InlineTutorRatingProps) {
  const queryClient = useQueryClient();

  const [myRating, setMyRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [canRate, setCanRate] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const response = await fetch(`/api/tutors/${tutorUserId}/rating`, {
        credentials: "include",
      });
      const data = (await response.json().catch(() => ({}))) as RatingResponse;

      if (response.status === 401) {
        if (mounted) setCanRate(false);
        return;
      }

      if (mounted && response.ok) {
        setMyRating(data.my_rating ?? null);
        setComment(data.my_comment ?? "");
        setAverageRating(data.average_rating ?? null);
        setRatingsCount(data.ratings_count ?? 0);
        setReviews(data.reviews ?? []);
      }
    })().catch(() => {
      // Keep the section visible even if loading fails.
    });

    return () => {
      mounted = false;
    };
  }, [tutorUserId]);

  const activeRating = hoveredRating ?? myRating ?? 0;

  const saveRating = async (rating: number) => {
    if (!canRate || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/tutors/${tutorUserId}/rating`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as RatingResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No se pudo guardar la calificación");
      }

      setMyRating(data.my_rating ?? rating);
      setAverageRating(data.average_rating ?? null);
      setRatingsCount(data.ratings_count ?? 0);
      setReviews(data.reviews ?? []);

      await queryClient.invalidateQueries({
        queryKey: ["dashboard-tutors"],
      });

      notifyRatingUpdated();
      toast.success("Calificación guardada");
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || "No se pudo guardar la calificación");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">Reseña del experto</span>
        <span className="text-xs text-muted-foreground">
          {averageRating != null ? `${averageRating.toFixed(1)} de 5 (${ratingsCount})` : "Sin calificaciones aún"}
        </span>
      </div>

      {canRate ? (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            placeholder="Escribe tu reseña (opcional) y luego elige las estrellas..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            disabled={isSaving}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Tu calificación:</span>
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
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">Inicia sesión para calificar y dejar una reseña.</p>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Reseñas ({reviews.length})</h4>

          {reviews.map((review) => (
            <div key={`${review.rater_user_id}-${review.created_at}`} className="rounded-md border border-border p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-neutral-300"
                      }`}
                    />
                  ))}
                </div>

                <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString("es-CO")}</span>
              </div>

              {review.comment ? <p className="text-sm text-muted-foreground">{review.comment}</p> : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
