"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { IconHeart, IconComment, IconShare, IconMap, IconSearch } from "@/components/icons/TmIcons";
import { toast } from "sonner";

import { fetchApi } from "@/lib/api";
import { FEATURED_TOPICS, SAMPLE_POSTS } from "@/lib/constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchFeedPosts(limit = 20, offset = 0): Promise<PostsResponse> {
  const response = await fetch(`/api/feed/posts?limit=${limit}&offset=${offset}`);
  if (!response.ok) {
    throw new Error("No se pudo cargar el feed");
  }
  return response.json();
}

async function createFeedPost(content: string) {
  const response = await fetch("/api/feed/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "No se pudo publicar");
  }

  return response.json();
}

interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

interface PostsResponse {
  posts: Post[];
  total: number;
}

interface Tutor {
  id: string;
  user_id: string;
  display_name?: string;
  full_name?: string;
  specialties?: string[];
  hourly_rate?: number;
  avatar_url?: string;
  is_available?: boolean;
}

const starterPosts: Post[] = SAMPLE_POSTS;

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [newPost, setNewPost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: postsData, isLoading: postsLoading } = useQuery<PostsResponse>({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      try {
        return await fetchFeedPosts(20, 0);
      } catch {
        return { posts: [], total: 0 };
      }
    },
  });

  const { data: tutorsData } = useQuery<{ tutors: Tutor[] }>({
    queryKey: ["tutors-sidebar"],
    queryFn: async () => {
      try {
        const res = await fetchApi<Tutor[] | { tutors?: Tutor[] }>("/api/tutors/?limit=5");
        const tutors = Array.isArray(res) ? res : res.tutors ?? [];

        // Enrich tutors with display_name and avatar from users service to avoid generic fallbacks
        const enriched = await Promise.all(
          tutors.map(async (t) => {
            try {
              const profile = await fetchApi<{ display_name?: string; avatar_url?: string }>(`/api/users/profiles/${t.user_id}`);
              return {
                ...t,
                display_name: profile?.display_name || t.display_name,
                avatar_url: profile?.avatar_url || t.avatar_url,
              } as Tutor;
            } catch {
              return t;
            }
          })
        );

        return { tutors: enriched };
      } catch {
        return { tutors: [] };
      }
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (content: string) => createFeedPost(content),
    onSuccess: () => {
      setNewPost("");
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post publicado");
    },
    onError: () => toast.error("Error al publicar"),
  });

  const handlePost = () => {
    if (!newPost.trim()) {
      return;
    }

    createPostMutation.mutate(newPost.trim());
  };

  const posts = postsData?.posts ?? [];
  const tutors = tutorsData?.tutors ?? [];
  const visiblePosts = posts.length > 0 ? posts : starterPosts;
  const isFallbackFeed = posts.length === 0;

  return (
    <div className="mx-auto grid max-w-7xl gap-6" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px' }}>
      <div className="min-w-0 flex-1 space-y-4">


        <div className="card" style={{ fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}>
          <div className="flex gap-3">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback>Tú</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(event) => setNewPost(event.target.value)}
                placeholder="¿Qué quieres compartir hoy? Comparte tips, busca tutor, o comparte tu progreso..."
                className="min-h-20 w-full resize-none border-0 bg-transparent text-sm outline-none focus:ring-0 placeholder:text-[rgba(253,251,212,0.5)]"
                style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}
                maxLength={500}
              />
              <div className="mt-2 flex items-center justify-between border-t pt-2" style={{ borderColor: 'rgba(253, 251, 212, 0.08)', color: 'rgba(253, 251, 212, 0.60)' }}>
                <span className="text-xs" style={{ fontFamily: 'var(--font-main)' }}>{newPost.length}/500</span>
                <Button
                  size="sm"
                  onClick={handlePost}
                  disabled={!newPost.trim() || createPostMutation.isPending}
                  style={{ backgroundColor: '#C4783A', color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}
                >
                  {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {postsLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="card">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" style={{ backgroundColor: 'rgba(253,251,212,0.1)' }} />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" style={{ backgroundColor: 'rgba(253,251,212,0.1)' }} />
                  <Skeleton className="h-3 w-20" style={{ backgroundColor: 'rgba(253,251,212,0.1)' }} />
                </div>
              </div>
              <Skeleton className="h-16 w-full" style={{ backgroundColor: 'rgba(253,251,212,0.1)' }} />
            </div>
          ))
        ) : (
          <div className="space-y-3">
            {isFallbackFeed && (
              <div className="card" style={{ color: 'rgba(253, 251, 212, 0.60)', fontFamily: 'var(--font-main)' }}>
                Mostrando publicaciones de ejemplo hasta que haya actividad real en el feed.
              </div>
            )}
            {visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>

      <aside className="hidden w-80 shrink-0 space-y-4 xl:flex xl:flex-col">
        <div className="card" style={{ fontFamily: 'var(--font-main)', color: 'var(--text-primary)' }}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}>Tutores destacados</h3>
            <Link href="/explore" className="text-xs hover:underline" style={{ color: '#C4783A', fontFamily: 'var(--font-main)' }}>
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {tutors.slice(0, 5).map((tutor) => (
              <div key={tutor.user_id} className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={tutor.avatar_url ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${tutor.user_id}`}
                    />
                    <AvatarFallback>
                      {(tutor.display_name ?? tutor.full_name ?? "T").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {tutor.is_available && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 bg-green-500" style={{ borderColor: 'var(--color-surface)' }} />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}>
                    {tutor.display_name ?? tutor.full_name ?? "Tutor"}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'rgba(253, 251, 212, 0.60)', fontFamily: 'var(--font-main)' }}>
                    {tutor.specialties?.slice(0, 2).join(", ") ?? "General"}
                  </p>
                </div>
                <Link
                  href={`/messages?userId=${tutor.user_id}`}
                  className="inline-flex h-7 items-center justify-center rounded-lg border px-2 text-xs font-medium transition-all hover:bg-[rgba(253,251,212,0.1)]"
                  style={{ borderColor: 'rgba(253, 251, 212, 0.25)', backgroundColor: 'transparent', color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}
                >
                  Contactar
                </Link>
              </div>
            ))}
          </div>
        </div>

        <Link href="/explore">
          <div className="card cursor-pointer" style={{ transition: 'background-color .12s ease' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(253, 251, 212, 0.08)' }}>
                <IconMap className="h-5 w-5 text-[var(--color-bg)]" />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}>Explorar en el mapa</p>
                <p className="text-xs" style={{ color: 'rgba(253, 251, 212, 0.60)', fontFamily: 'var(--font-main)' }}>Tutores cerca de ti</p>
              </div>
            </div>
          </div>
        </Link>
      </aside>
    </div>
  );
}

interface PostCardProps {
  post: Post;
}

function PostCard({ post }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <article className="card transition-shadow hover:shadow-md" style={{ fontFamily: 'var(--font-main)' }}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage
            src={post.author_avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_id}`}
          />
          <AvatarFallback>{(post.author_name ?? "U").substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold" style={{ color: 'var(--color-bg)', fontFamily: 'var(--font-main)' }}>{post.author_name ?? "Usuario"}</span>
            <span className="shrink-0 text-xs" style={{ color: 'rgba(253, 251, 212, 0.60)', fontFamily: 'var(--font-main)' }}>· {formatDate(post.created_at)}</span>
          </div>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'rgba(253, 251, 212, 0.85)', fontFamily: 'var(--font-main)' }}>{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="Post image"
              className="mt-3 max-h-80 w-full object-cover"
              style={{ borderRadius: 'var(--radius)', border: '1px solid rgba(253, 251, 212, 0.25)' }}
            />
          )}

          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={() => {
                setLiked((previous) => {
                  setLikeCount((count) => count + (previous ? -1 : 1));
                  return !previous;
                });
              }}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: liked ? '#C4783A' : 'rgba(253, 251, 212, 0.60)' }}
            >
              <IconHeart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount}
            </button>
            <button
              onClick={() => toast.info("Comentarios próximamente")}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--color-bg)]"
              style={{ color: 'rgba(253, 251, 212, 0.60)' }}
            >
              <IconComment className="h-4 w-4" />
              Comentar
            </button>
            <button
              onClick={() => toast.info("Compartir próximamente")}
              className="ml-auto flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--color-bg)]"
              style={{ color: 'rgba(253, 251, 212, 0.60)' }}
            >
              <IconShare className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
