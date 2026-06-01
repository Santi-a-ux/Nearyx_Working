"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ImagePlus, MessageSquare, Share2, Star, Upload, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/user-avatar";
import InlineTutorRating from "@/components/profile/inline-tutor-rating";
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

    return { tutors: sortExpertsByRating(enriched).slice(0, 4) };
  } catch {
    return { tutors: [] };
  }
}

export function DashboardContent() {
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
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
      <section className="min-w-0 space-y-4">
        <Card className="p-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserAvatar name={currentUserLabel} size="md" avatarUrl={currentUserAvatar} />
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 justify-start rounded-2xl border border-border bg-[#ffffff] px-4 text-left text-[#3d4d5a] shadow-none hover:bg-[rgba(198,226,254,0.92)] hover:text-foreground"
                onClick={() => setComposerOpen(true)}
              >
                ¿Qué estás pensando? Comparte texto, emojis o una imagen.
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
          <DialogContent className="w-[min(92vw,720px)] max-w-[720px] border border-[#95C9FC] bg-[#95C9FC] p-0 text-[var(--ui-dark-panel-text)] shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
            <DialogHeader className="border-b border-[#95C9FC] px-5 py-4">
              <DialogTitle className="text-center text-[1.15rem] font-semibold text-[#ffffff]">Crear publicación</DialogTitle>
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
                  <p className="text-sm font-semibold text-[#ffffff]">Tu publicación</p>
                  <p className="text-xs text-[#10314f]/70">Solo texto, emojis e imágenes</p>
                </div>
              </div>

              <Textarea
                value={newPost}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNewPost(event.target.value)}
                placeholder="¿Qué estás pensando?"
                className="min-h-40 resize-none rounded-2xl border border-[#95C9FC] bg-[#95C9FC] px-4 py-3 text-[var(--ui-dark-panel-text)] placeholder:text-[#10314f]/60 focus:border-[#95C9FC] focus:bg-[#95C9FC]"
                maxLength={500}
              />

              {attachedImagePreview ? (
                <div className="relative overflow-hidden rounded-2xl border border-[#95C9FC] bg-[#95C9FC]">
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

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#95C9FC] px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[#ffffff]">
                  <span>Agregar a tu publicación</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full bg-[#95C9FC] text-[#10314f] hover:bg-[rgba(149,201,252,0.88)] hover:text-[#10314f]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="rounded-full bg-[#95C9FC] text-[#10314f] hover:bg-[rgba(149,201,252,0.88)] hover:text-[#10314f]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={imageUploading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  {imageUploading ? <span className="text-xs text-[#10314f]/70">Subiendo imagen...</span> : null}
                </div>

                <span className="text-xs text-[#10314f]/70">{newPost.length}/500</span>
              </div>

              <DialogFooter className="-mx-5 -mb-4 border-t border-[#95C9FC] bg-[#95C9FC] px-5 py-4">
                <Button
                  type="submit"
                  disabled={!newPost.trim() || createPostMutation.isPending || imageUploading}
                  className="h-11 rounded-full bg-[#95C9FC] px-6 text-sm font-semibold text-[#10314f] hover:bg-[rgba(149,201,252,0.88)]"
                >
                  {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="bg-white">
          {searchQuery ? (
            filteredPosts.length > 0 ? null : (
              <Card className="rounded-none border-0 border-b border-dashed border-[#eef2f7] bg-white shadow-none last:border-b-0">
                <CardContent className="p-5 text-sm text-muted-foreground">
                No hay publicaciones que coincidan con “{searchQuery}”. Prueba con otra palabra o temática.
                </CardContent>
              </Card>
            )
          ) : null}

          {isLoading && posts.length === 0 ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="rounded-none border-0 border-b border-[#eef2f7] bg-white shadow-none last:border-b-0">
                <CardContent className="p-4">
                <div className="h-6 w-48 rounded bg-[#f4ffee]" />
                <div className="mt-4 h-24 rounded bg-[#f3f6fb]" />
                </CardContent>
              </Card>
            ))
          ) : (
            filteredPosts.map((post: FeedPost, index: number) => (
              <PostCard key={post.id} post={post} toneIndex={index} isLast={index === filteredPosts.length - 1} />
            ))
          )}
        </div>
      </section>

      <aside className="space-y-4 self-start xl:sticky xl:top-[calc(3.5rem+1rem)] xl:w-[260px]">
        <Card className="p-0 bg-[#F8FBFF]">
          <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Expertos destacados</p>
              <h2 className="mt-1 text-sm font-bold text-foreground">Mejor calificados</h2>
            </div>
            <Badge variant="default" className="rounded-full bg-[#ff5757] text-[var(--primary-foreground)] shadow-sm">
              En vivo
            </Badge>
          </div>
          </CardHeader>

          <CardContent className="mt-0 p-4 pt-4">
          <div className="space-y-3">
            {tutors.length === 0 ? (
              <Card className="border-dashed p-0 bg-[#ffffff]">
                <CardContent className="p-4 text-sm text-muted-foreground">
                Aún no hay expertos para mostrar.
                </CardContent>
              </Card>
            ) : (
              tutors.map((tutor) => (
                <Card key={tutor.user_id} className="p-0 bg-[#F8FBFF]">
                  <CardContent className="flex items-center gap-3 p-3">
                  <div className="relative shrink-0">
                    <UserAvatar name={tutor.display_name || tutor.full_name || "Experto"} size="sm" avatarUrl={tutor.avatar_url} />
                    <span className={cn("absolute -right-0.5 bottom-0 h-2.5 w-2.5 rounded-full border-2 border-white", tutor.is_available ? "bg-[#95C9FC]" : "bg-[var(--neutral-400)]")} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{tutor.display_name || tutor.full_name || "Experto"}</p>
                    <p className="truncate text-xs text-muted-foreground">{tutor.specialties?.[0] || "Experiencia general"}</p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        {typeof tutor.average_rating === "number"
                          ? `${tutor.average_rating.toFixed(1)} (${tutor.ratings_count || 0})`
                          : "Sin calificaciones"}
                      </span>
                    </div>
                    <Link href={`/messages?userId=${tutor.user_id}`} className="mt-2 inline-flex text-xs font-bold text-primary hover:text-brand-hover">
                      Contactar
                    </Link>
                  </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          </CardContent>
        </Card>

        <Card className="bg-[#95C9FC] p-0 text-[#10314f] shadow-[0_18px_40px_rgba(15,23,42,0.22)] transition-transform hover:-translate-y-0.5">
          <CardContent className="p-4">
          <Link href="/explore" className="block">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#10314f]/80">Mapa vivo</p>
          <h3 className="mt-2 text-lg font-bold text-[#10314f]">Explorar en el mapa</h3>
          <p className="mt-2 text-sm text-[#10314f]/82">Revisa expertos cercanos, categorías activas y disponibilidad en tiempo real.</p>
          </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}

function PostCard({ post, toneIndex, isLast }: { post: FeedPost; toneIndex: number; isLast: boolean }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(12 + toneIndex);
  const isExpert = isExpertFeedAuthorRole(post.author_role) || post.author_role === "Tutor";

  return (
    <article className={cn("group border-b border-[#f8fbff] bg-[#f8fbff] transition-all hover:bg-[#ffffff] hover:shadow-[0_1px_0_rgba(217,227,244,0.35),0_10px_24px_rgba(15,23,42,0.06)] hover:rounded-2xl", isLast && "border-b-0")}>
      <div className="p-4 transition-colors">
        <div className="flex items-start gap-3">
          <UserAvatar name={post.author_name || "Usuario"} size="md" avatarUrl={post.author_avatar} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-semibold text-[#111827]">{post.author_name || "Usuario"}</h3>
              <span className="text-xs text-[#6b7280]">•</span>
              <span className="text-xs text-[#6b7280]">{new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(post.created_at))}</span>
              <Badge
                variant={isExpert ? "default" : "secondary"}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px]",
                  isExpert ? "bg-[#fa5e03] text-[#ffffff]" : "bg-[#4400ff] text-[#ffffff]"
                )}
              >
                {isExpert ? "Experto" : "Estudiante"}
              </Badge>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-6 text-[#111827]">{post.content}</p>

            {post.image_url ? (
              <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-[#f8fbff]">
                <img src={post.image_url} alt={post.author_name || "Publicación"} className="max-h-[32rem] w-full object-cover" />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#4b5563]">
              <Button
                type="button"
                onClick={() => {
                  setLiked((previous) => {
                    setLikes((value) => value + (previous ? -1 : 1));
                    return !previous;
                  });
                }}
                variant="ghost"
                size="sm"
                className="h-8 rounded-full border border-transparent px-3 text-xs text-[#4b5563] transition-colors hover:border-[#d9e3f4] hover:bg-[#eaf1ff] hover:text-[#0058ff]"
              >
                <Heart className={cn("h-4 w-4", liked && "fill-current text-[#0058ff]")} />
                {likes}
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full border border-transparent px-3 text-xs text-[#4b5563] transition-colors hover:border-[#d9e3f4] hover:bg-[#eaf1ff] hover:text-[#0058ff]">
                <MessageSquare className="h-4 w-4" />
                Comentar
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full border border-transparent px-3 text-xs text-[#4b5563] transition-colors hover:border-[#d9e3f4] hover:bg-[#eaf1ff] hover:text-[#0058ff]">
                <Share2 className="h-4 w-4" />
                Compartir
              </Button>
            </div>

            {isExpert && isUuid(post.author_id) ? (
              <InlineTutorRating tutorUserId={post.author_id} />
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
