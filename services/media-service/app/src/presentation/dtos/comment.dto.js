export const toCommentDto = (c) => ({
  id: c.id,
  post_id: c.postId,
  author_id: c.authorId,
  author_name: c.authorName,
  author_avatar: c.authorAvatar,
  content: c.content,
  created_at: c.createdAt,
});

export const toCommentInput = (b) => ({
  postId: b.post_id,
  authorId: b.author_id,
  authorName: b.author_name,
  authorAvatar: b.author_avatar,
  content: b.content,
});
