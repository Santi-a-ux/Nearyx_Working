/**
 * Relevance rules of the semantic search (calibrated on real data in the Python service).
 * With very short specialties the model squeezes the distances ("llanta" -> Mecánico 0.23 vs Cocinero 0.25),
 * so instead of one absolute cut we keep results close to the best match of THIS search.
 */
export const SEMANTIC_SEARCH = {
  absoluteCeiling: 0.16, // anything further is unrelated
  relativeMargin: 0.02, // max distance gap to the best match
  minQualityThreshold: 0.12, // if even the best match is further than this, there is no real match
};

export const VERIFICATION_REVIEW_STATUSES = ['approved', 'rejected'];
