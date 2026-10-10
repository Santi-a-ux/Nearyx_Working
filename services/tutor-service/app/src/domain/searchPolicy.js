/**
 * Relevance rules of the semantic search.
 *
 * With short profiles the E5 model squeezes all distances into a narrow band (e.g. 0.15-0.19), so NO absolute
 * threshold can tell a real match from noise ("arreglar carro" -> Mecánico is 0.1617, worse than the noise of
 * "matematicas" -> Mecánico, 0.1584). What does tell them apart is how far the best match stands out from the
 * rest of the catalog: a real match is clearly below the median distance, noise is not.
 *
 * A search returns results only if:
 *   1. best <= median - minSeparation      (there is a real match, not just noise)
 *   2. distance <= best + relativeMargin   (keep the cluster around the best match)
 *   3. distance <  absoluteCeiling         (sanity cap)
 * Calibrate with `npm run calibrate:search` and inspect single searches with `npm run debug:search`.
 */
const fromEnv = (name, fallback) => {
  const raw = process.env[name];
  const value = raw === undefined || raw === '' ? NaN : Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

export const SEMANTIC_SEARCH = {
  absoluteCeiling: fromEnv('SEMANTIC_ABSOLUTE_CEILING', 0.22),
  relativeMargin: fromEnv('SEMANTIC_RELATIVE_MARGIN', 0.03),
  minSeparation: fromEnv('SEMANTIC_MIN_SEPARATION', 0.025),
  /** Below this many embedded profiles the median means nothing, so the separation rule is skipped. */
  minProfilesForSeparation: 3,
};

/** JS mirror of the SQL in TutorProfileRepository.searchSemantic (used by the debug/calibration scripts). */
export function evaluateDistances(distances, policy = SEMANTIC_SEARCH) {
  const sorted = [...distances].map(Number).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return { n, best: null, median: null, separation: null, hasMatch: false, accepted: [] };
  const best = sorted[0];
  const median = (sorted[Math.floor((n - 1) / 2)] + sorted[Math.ceil((n - 1) / 2)]) / 2; // = percentile_cont(0.5)
  const separation = median - best;
  const hasMatch = n < policy.minProfilesForSeparation || separation >= policy.minSeparation;
  const accepted = hasMatch
    ? sorted.filter((d) => d < policy.absoluteCeiling && d <= best + policy.relativeMargin)
    : [];
  return { n, best, median, separation, hasMatch, accepted };
}

export const VERIFICATION_REVIEW_STATUSES = ['approved', 'rejected'];