"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ImagePlus, MessageSquare, Send, Share2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import { DashboardRightPanel } from "@/components/dashboard/dashboard-right-panel";
import InlineTutorRating from "@/components/profile/inline-tutor-rating";
import { cardElevatedClass } from "@/lib/surface-styles";
import { SAMPLE_POSTS } from "@/lib/constants";
import { isExpertFeedAuthorRole, mapSessionRoleToFeedAuthorRole, type FeedAuthorRole } from "@/lib/feed-author-role";
import { RATING_UPDATED_EVENT } from "@/lib/rating-events";
import { matchesKeywordSearch } from "@/lib/tutor-search";
import { cn } from "@/lib/utils";

interface FeedPost {
  id: string;
  author_id: string;
  author_name?: string;
  author_role?: FeedAuthorRole | "Tutor";
  author_avatar?: string;
  content: string;
  created_at: string;
  image_url?: string;
}

interface FeedResponse {
  posts: FeedPost[];
  total: number;
}

interface TutorSidebarItem {
  id?: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  specialties?: string[];
  avatar_url?: string;
  is_available?: boolean;
  average_rating?: number | null;
  ratings_count?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
}

interface TutorRatingSummary {
  average_rating?: number | null;
  ratings_count?: number;
}

interface SessionUserProfile {
  user_id?: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
}

interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
}

const starterPosts: FeedPost[] = SAMPLE_POSTS.map((post, index) => ({
  ...post,
  author_role: index % 2 === 0 ? "Estudiante" : "Experto",
})) as FeedPost[];

async function fetchFeedPosts(limit = 20, offset = 0): Promise<FeedResponse> {
  const response = await fetch(`/api/feed/posts?limit=${limit}&offset=${offset}`);
  if (!response.ok) throw new Error("No se pudo cargar el feed");
  return response.json();
}

async function createFeedPost(content: string, imageUrl?: string, authorRole?: FeedAuthorRole) {
  const response = await fetch("/api/feed/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, image_url: imageUrl, author_role: authorRole }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "No se pudo publicar");
  return data;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function enrichFeedPost(
  post: FeedPost,
  currentUser?: SessionUserProfile | null,
  expertUserIds?: ReadonlySet<string>
): FeedPost {
  if (post.author_role) return post;

  if (currentUser?.user_id && post.author_id === String(currentUser.user_id)) {
    const role = mapSessionRoleToFeedAuthorRole(currentUser.role);
    if (role) return { ...post, author_role: role };
  }

  if (expertUserIds?.has(post.author_id)) {
    return { ...post, author_role: "Experto" };
  }

  return post;
}

function sortExpertsByRating(tutors: TutorSidebarItem[]) {
  return [...tutors].sort((a, b) => {
    const avgA = typeof a.average_rating === "number" ? a.average_rating : -1;
    const avgB = typeof b.average_rating === "number" ? b.average_rating : -1;
    if (avgB !== avgA) return avgB - avgA;
    return (b.ratings_count ?? 0) - (a.ratings_count ?? 0);
  });
}

async function fetchFeaturedExperts(): Promise<{ tutors: TutorSidebarItem[] }> {
  try {
    const res = await fetch("/api/tutors/?limit=50", { credentials: "include", cache: "no-store" });
    if (!res.ok) return { tutors: [] };

    const data = await res.json();
    const tutors: TutorSidebarItem[] = Array.isArray(data) ? data : data.tutors ?? [];

    const enriched = await Promise.all(
      tutors.map(async (tutor) => {
        try {
          const [profileRes, ratingRes] = await Promise.all([
            fetch(`/api/users/profiles/${tutor.user_id}`, { credentials: "include", cache: "no-store" }),
            fetch(`/api/tutors/${tutor.user_id}/rating`, { credentials: "include", cache: "no-store" }),
          ]);

          const profile = profileRes.ok ? await profileRes.json().catch(() => null) : null;
          const rating = ratingRes.ok ? ((await ratingRes.json().catch(() => null)) as TutorRatingSummary | null) : null;

          return {
            ...tutor,
            display_name: profile?.display_name || tutor.display_name,
            avatar_url: profile?.avatar_url || tutor.avatar_url,
            average_rating: rating?.average_rating ?? null,
            ratings_count: rating?.ratings_count ?? 0,
          };
        } catch {
          return tutor;
        }
      })
    );

    return { tutors: sortExpertsByRating(enriched).slice(0, 8) };
  } catch {
    return { tutors: [] };
  }
}

export function DashboardContent({ mapboxAccessToken = "" }: { mapboxAccessToken?: string }) {
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [attachedImagePreview, setAttachedImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const { data: currentUserProfile } = useQuery<SessionUserProfile | null>({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      try {
        const sessionResponse = await fetch("/api/session");
        if (!sessionResponse.ok) return null;

        const sessionData = (await sessionResponse.json().catch(() => ({}))) as SessionUserProfile;
        if (!sessionData.user_id) return sessionData;

        const profileResponse = await fetch(`/api/users/profiles/${sessionData.user_id}`);
        if (!profileResponse.ok) return sessionData;

        const profileData = (await profileResponse.json().catch(() => ({}))) as SessionUserProfile;
        return {
          ...sessionData,
          display_name: profileData.display_name || sessionData.display_name,
          avatar_url: profileData.avatar_url || sessionData.avatar_url,
          role: sessionData.role,
        };
      } catch {
        return null;
      }
    },
  });

  useEffect(() => {
    const readCurrentQuery = () => {
      if (!window.location.pathname.startsWith("/dashboard")) {
        setSearchQuery("");
        return;
      }
      const currentParams = new URLSearchParams(window.location.search);
      setSearchQuery(currentParams.get("q") || "");
    };

    readCurrentQuery();
    window.addEventListener("popstate", readCurrentQuery);
    window.addEventListener("nearyx-search", readCurrentQuery as EventListener);

    return () => {
      window.removeEventListener("popstate", readCurrentQuery);
      window.removeEventListener("nearyx-search", readCurrentQuery as EventListener);
    };
  }, []);

  useEffect(() => {
    const refreshFeaturedExperts = () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard-tutors"] });
    };

    window.addEventListener(RATING_UPDATED_EVENT, refreshFeaturedExperts);
    return () => window.removeEventListener(RATING_UPDATED_EVENT, refreshFeaturedExperts);
  }, [queryClient]);

  const { data: feedData, isLoading } = useQuery<FeedResponse>({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      try {
        return await fetchFeedPosts(20, 0);
      } catch {
        return { posts: [], total: 0 };
      }
    },
  });

  const { data: tutorsData } = useQuery<{ tutors: TutorSidebarItem[] }>({
    queryKey: ["dashboard-tutors"],
    queryFn: fetchFeaturedExperts,
    staleTime: 0,
  });

  const createPostMutation = useMutation({
    mutationFn: ({
      content,
      imageUrl,
      authorRole,
    }: {
      content: string;
      imageUrl?: string | null;
      authorRole?: FeedAuthorRole;
    }) => createFeedPost(content, imageUrl || undefined, authorRole),
    onSuccess: () => {
      setNewPost("");
      setAttachedImageUrl(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setAttachedImagePreview(null);
      setComposerOpen(false);
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Publicación creada");
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Error al publicar");
    },
  });

  const tutors = tutorsData?.tutors ?? [];
  const expertUserIds = new Set(tutors.map((tutor) => tutor.user_id));
  const rawPosts = feedData?.posts?.length ? feedData.posts : starterPosts;
  const posts = rawPosts.map((post) => enrichFeedPost(post, currentUserProfile, expertUserIds));
  const filteredPosts = searchQuery ? posts.filter((post) => matchesKeywordSearch(`${post.content} ${post.author_name || ""}`, searchQuery)) : posts;
  const currentUserLabel = currentUserProfile?.display_name || currentUserProfile?.email?.split("@")[0] || "Tu";
  const currentUserAvatar = currentUserProfile?.avatar_url || undefined;

  const handlePublish = () => {
    if (!newPost.trim()) return;
    createPostMutation.mutate({
      content: newPost.trim(),
      imageUrl: attachedImageUrl,
      authorRole: mapSessionRoleToFeedAuthorRole(currentUserProfile?.role),
    });
  };

  const clearAttachment = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setAttachedImagePreview(null);
    setAttachedImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    clearAttachment();
    const previewUrl = URL.createObjectURL(file);
    previewUrlRef.current = previewUrl;
    setAttachedImagePreview(previewUrl);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "post");

    setImageUploading(true);
    try {
      const response = await fetch("/api/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || data.detail || "No se pudo cargar la imagen");

      setAttachedImageUrl(data.url || data.file_url || data.secure_url || null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la imagen");
      clearAttachment();
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5">
        <div className={cn(cardElevatedClass, "p-5")}>
          <div className="flex gap-3">
            <UserAvatar name={currentUserLabel} size="md" avatarUrl={currentUserAvatar} />
            <div className="min-w-0 flex-1">
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-12 w-full justify-start rounded-xl border-input bg-muted/50 px-4 py-3 text-left text-body text-muted-foreground shadow-none hover:bg-muted"
                onClick={() => setComposerOpen(true)}
              >
                ¿Qué quieres aprender o enseñar hoy?
              </Button>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-caption text-muted-foreground">· Publicará cerca de tu ubicación</span>
                <Button type="button" variant="brand" size="sm" onClick={() => setComposerOpen(true)}>
                  Publicar
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
          <DialogContent className="w-[min(92vw,720px)] max-w-[720px] gap-0 border border-border bg-card p-0 shadow-lg">
            <DialogHeader className="border-b border-border px-5 py-4">
              <DialogTitle className="text-h3 text-center">Crear publicación</DialogTitle>
            </DialogHeader>

            <form
              className="space-y-4 px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                handlePublish();
              }}
            >
              <div className="flex items-start gap-3">
                <UserAvatar name={currentUserLabel} size="md" avatarUrl={currentUserAvatar} />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold">Tu publicación</p>
                  <p className="text-caption text-muted-foreground">Texto, emojis e imágenes</p>
                </div>
              </div>

              <Textarea
                value={newPost}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNewPost(event.target.value)}
                placeholder="¿Qué estás pensando?"
                className="min-h-40 resize-none rounded-xl border-input bg-muted/40"
                maxLength={500}
              />

              {attachedImagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-border">
                  <img src={attachedImagePreview} alt="Vista previa de imagen" className="max-h-96 w-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-3 top-3 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    onClick={clearAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}

              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2 text-body font-medium">
                  <span>Agregar imagen</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  {imageUploading ? <span className="text-caption text-muted-foreground">Subiendo…</span> : null}
                </div>

                <span className="text-caption text-muted-foreground">{newPost.length}/500</span>
              </div>

              <DialogFooter className="-mx-5 -mb-4 border-t border-border bg-muted/20 px-5 py-4">
                <Button
                  type="submit"
                  variant="brand"
                  disabled={!newPost.trim() || createPostMutation.isPending || imageUploading}
                  className="min-w-[140px]"
                >
                  {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-5">
          {searchQuery && filteredPosts.length === 0 ? (
            <div className={cn(cardElevatedClass, "p-5 text-body text-muted-foreground")}>
              No hay publicaciones que coincidan con “{searchQuery}”.
            </div>
          ) : null}

          {isLoading && posts.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className={cn(cardElevatedClass, "h-40 animate-pulse bg-muted/40")} />
              ))
            : filteredPosts.map((post: FeedPost, index: number) => (
                <PostCard key={post.id} post={post} toneIndex={index} />
              ))}
        </div>
      </section>

      <div className="xl:sticky xl:top-[calc(3.5rem+1rem)] xl:self-start">
        <DashboardRightPanel mapboxAccessToken={mapboxAccessToken} tutors={tutors} />
      </div>
    </div>
  );
}

function PostCard({ post, toneIndex }: { post: FeedPost; toneIndex: number }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(12 + toneIndex);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const isExpert = isExpertFeedAuthorRole(post.author_role) || post.author_role === "Tutor";

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/feed/posts/${post.id}/comments`, { credentials: "include" });
      if (!response.ok) return;
      const data = await response.json();
      setComments(Array.isArray(data.comments) ? data.comments : []);
      setCommentsLoaded(true);
    } catch {
      // Keep comments section usable even if loading fails.
    }
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && !commentsLoaded) {
      await loadComments();
    }
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const response = await fetch(`/api/feed/posts/${post.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "No se pudo publicar el comentario");
      }

      setComments((previous) => [...previous, data as FeedComment]);
      setCommentText("");
      setCommentsLoaded(true);
      if (!showComments) setShowComments(true);
      toast.success("Comentario publicado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo publicar el comentario");
    } finally {
      setCommentSubmitting(false);
    }
  };

  return (
    <article className={cn(cardElevatedClass, "p-6")}>
        <div className="flex items-start gap-3">
          <UserAvatar name={post.author_name || "Usuario"} size="md" avatarUrl={post.author_avatar} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-h3">{post.author_name || "Usuario"}</h3>
              <Badge variant={isExpert ? "expert" : "student"} className="rounded-full px-2 py-0.5 text-[11px]">
                {isExpert ? "Experto" : "Estudiante"}
              </Badge>
            </div>
            <div className="text-caption mt-0.5 text-muted-foreground">
              {new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_at))}
            </div>

            <p className="text-body-lg mt-4 whitespace-pre-wrap">{post.content}</p>

            {post.image_url ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-[#f8fbff]">
                <img src={post.image_url} alt={post.author_name || "Publicación"} className="max-h-[32rem] w-full object-cover" />
              </div>
            ) : null}

            <footer className="mt-5 flex flex-wrap items-center gap-1 border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setLiked((previous) => {
                    setLikes((value) => value + (previous ? -1 : 1));
                    return !previous;
                  });
                }}
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current text-primary")} />
                <span className="text-caption">{likes}</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="gap-2" onClick={() => void toggleComments()}>
                <MessageSquare className="h-4 w-4" />
                <span className="text-caption">
                  {commentsLoaded ? `Comentarios (${comments.length})` : "Comentar"}
                </span>
              </Button>
              <Button type="button" variant="ghost" size="sm">
                <Share2 className="h-4 w-4" />
              </Button>
              {isExpert && isUuid(post.author_id) ? (
                <div className="ml-auto">
                  <Link href={`/messages?userId=${post.author_id}`} className={buttonVariants({ variant: "subtle", size: "sm" })}>
                    Contactar
                  </Link>
                </div>
              ) : null}
            </footer>

            {showComments ? (
              <div className="mt-4 space-y-3 border-t border-border pt-4">
                <div className="flex gap-2">
                  <Input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Escribe un comentario..."
                    maxLength={500}
                    disabled={commentSubmitting}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void submitComment();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="brand"
                    size="sm"
                    disabled={!commentText.trim() || commentSubmitting}
                    onClick={() => void submitComment()}
                  >
                    {commentSubmitting ? "..." : "Enviar"}
                  </Button>
                </div>

                {comments.length === 0 ? (
                  <p className="text-caption text-muted-foreground">Sé el primero en comentar esta publicación.</p>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((comment) => (
                      <li key={comment.id} className="flex gap-2">
                        <UserAvatar name={comment.author_name} size="sm" avatarUrl={comment.author_avatar} />
                        <div className="min-w-0 flex-1 rounded-xl bg-muted/40 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-body font-medium">{comment.author_name}</span>
                            <span className="text-caption text-muted-foreground">
                              {new Intl.DateTimeFormat("es-CO", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              }).format(new Date(comment.created_at))}
                            </span>
                          </div>
                          <p className="text-body mt-1 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}

            {isExpert && isUuid(post.author_id) ? (
              <InlineTutorRating tutorUserId={post.author_id} />
            ) : null}
          </div>
        </div>
    </article>
  );
}
