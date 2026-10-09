export const toTutorDto = (p) => ({
  id: p.id,
  user_id: p.userId,
  specialties: p.specialties,
  categories: p.categories,
  hourly_rate: p.hourlyRate,
  years_experience: p.yearsExperience,
  lat: p.lat,
  lng: p.lng,
  is_available: p.isAvailable,
  preferred_payment_method: p.preferredPaymentMethod,
  verification_status: p.verificationStatus,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

// snake_case request body -> camelCase application input (undefined/null = "not sent")
export const toProfileInput = (b) => ({
  specialties: b.specialties,
  categories: b.categories,
  hourlyRate: b.hourly_rate,
  yearsExperience: b.years_experience,
  lat: b.lat,
  lng: b.lng,
  isAvailable: b.is_available,
  preferredPaymentMethod: b.preferred_payment_method,
});

export const toRatingDto = (s) => ({
  my_rating: s.myRating,
  my_comment: s.myComment,
  average_rating: s.averageRating,
  ratings_count: s.ratingsCount,
  reviews: s.reviews.map((r) => ({
    rating: r.rating,
    comment: r.comment,
    rater_user_id: r.raterUserId,
    created_at: r.createdAt,
    updated_at: r.updatedAt,
  })),
});

export const toNetworkDto = (graph) => ({
  user_id: graph.userId,
  nodes: graph.nodes.map((n) => ({
    user_id: n.userId,
    display_name: n.displayName,
    bio: n.bio,
    avatar_url: n.avatarUrl,
    role: n.role,
    specialties: n.specialties,
    categories: n.categories,
  })),
  edges: graph.edges.map((e) => ({ source: e.source, target: e.target, edge_type: e.type })),
});
