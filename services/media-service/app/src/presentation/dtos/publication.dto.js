export const toPublicationDto = (p) => ({
  id: p.id,
  author_id: p.authorId,
  content: p.content,
  image_url: p.imageUrl,
  created_at: p.createdAt,
  author_name: p.authorName,
  author_avatar: p.authorAvatar,
  author_role: p.authorRole,
});

export const toPublicationInput = (b) => ({
  authorId: b.author_id,
  authorName: b.author_name,
  authorAvatar: b.author_avatar,
  authorRole: b.author_role,
  content: b.content,
  imageUrl: b.image_url,
});

// Keeps the "was it sent?" information: absent keys stay absent, null stays null.
export const toPublicationChanges = (b) => {
  const changes = {};
  if (Object.hasOwn(b, 'content')) changes.content = b.content;
  if (Object.hasOwn(b, 'image_url')) changes.imageUrl = b.image_url;
  if (Object.hasOwn(b, 'author_role')) changes.authorRole = b.author_role;
  return changes;
};
