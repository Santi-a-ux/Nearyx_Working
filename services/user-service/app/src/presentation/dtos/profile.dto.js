export const toProfileDto = (p) => ({
  id: p.id,
  user_id: p.userId,
  display_name: p.displayName,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  location_name: p.locationName,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

// snake_case request body -> camelCase application input
export const toProfileInput = (body) => ({
  displayName: body.display_name,
  bio: body.bio,
  avatarUrl: body.avatar_url,
  locationName: body.location_name,
});
