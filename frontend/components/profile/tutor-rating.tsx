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

export default function TutorRating({ tutorUserId, initialAverage, initialCount = 0 }: TutorRatingProps) {
  const queryClient = useQueryClient();
  const [myRating, setMyRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(initialAverage ?? null);
  const [ratingsCount, setRatingsCount] = useState(initialCount);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [canRate, setCanRate] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const response = await fetch(`/api/tutors/${tutorUserId}/rating`, {
          credentials: "include",
        });
        if (response.status === 401) {
          if (mounted) {
            setCanRate(false);
          }
          return;
        }

        const data = (await response.json().catch(() => ({}))) as RatingResponse;
        if (!response.ok) {
          throw new Error(data.detail || data.error || "No se pudo cargar tu calificación");
        }

        if (mounted) {
          setMyRating(data.my_rating ?? null);
          setComment(data.my_comment ?? "");
          setAverageRating(data.average_rating ?? null);
          setRatingsCount(data.ratings_count ?? 0);
          setReviews(data.reviews ?? []);
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
      return "Sin valoraciones todavía";
    }

    return `${averageRating.toFixed(1)} de 5 (${ratingsCount} ${ratingsCount === 1 ? "valoración" : "valoraciones"})`;
  }, [averageRating, ratingsCount]);

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
      await queryClient.invalidateQueries({ queryKey: ["dashboard-tutors"] });
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
    <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: "rgba(56, 36, 13, 0.18)" }}>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "#38240D", fontFamily: "var(--font-main)" }}>
            Reseña del experto
          </h3>
          <p className="mt-1 text-sm" style={{ color: "rgba(56, 36, 13, 0.60)", fontFamily: "var(--font-main)" }}>
            {ratingLabel}
          </p>
        </div>

        {canRate ? (
          <>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
              placeholder="Escribe tu reseña (opcional) y luego elige las estrellas..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              disabled={isSaving || isLoading}
            />

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
          </>
        ) : (
          <p className="text-xs" style={{ color: "rgba(56, 36, 13, 0.50)", fontFamily: "var(--font-main)" }}>
            Inicia sesión para calificar y dejar una reseña.
          </p>
        )}

        {canRate ? (
          <p className="text-xs" style={{ color: "rgba(56, 36, 13, 0.50)", fontFamily: "var(--font-main)" }}>
            {myRating
              ? `Tu calificación actual es ${myRating} de 5. Puedes cambiarla cuando quieras.`
              : "Selecciona una estrella para guardar tu calificación."}
          </p>
        ) : null}
      </div>

      {reviews.length > 0 ? (
        <div className="mt-5 space-y-3 border-t pt-4" style={{ borderColor: "rgba(56, 36, 13, 0.12)" }}>
          <h4 className="text-sm font-semibold" style={{ color: "#38240D", fontFamily: "var(--font-main)" }}>
            Reseñas ({reviews.length})
          </h4>
          {reviews.map((review) => (
            <div
              key={`${review.rater_user_id}-${review.created_at}`}
              className="rounded-md border p-3"
              style={{ borderColor: "rgba(56, 36, 13, 0.12)" }}
            >
              <div className="mb-1 flex items-center gap-2">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-3.5 w-3.5 ${
                        star <= review.rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(review.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
              {review.comment ? (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
