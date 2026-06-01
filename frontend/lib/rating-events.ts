export const RATING_UPDATED_EVENT = "nearyx-rating-updated";

export function notifyRatingUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(RATING_UPDATED_EVENT));
  }
}
