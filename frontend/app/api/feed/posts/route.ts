import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

type FeedPost = {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
};

// In-memory store for feed posts (will be reset when server restarts)
let feedPosts: FeedPost[] = [];

// Populate with sample posts on initialization
function initializeSamplePosts() {
  if (feedPosts.length === 0) {
    feedPosts = [
      {
        id: "sample-1",
        author_id: "maria",
        content: "Necesito reforzar Cálculo para mi examen de admisión. ¿Alguien disponible para sesiones en la tarde?",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        author_name: "María José González",
        author_avatar: undefined,
      },
      {
        id: "sample-2",
        author_id: "roberto",
        content: "Ingeniero de software con 8 años de experiencia. Ofrezco clases de Python y JavaScript.",
        created_at: new Date(Date.now() - 7200000).toISOString(),
        author_name: "Roberto Martínez",
        author_avatar: undefined,
      },
    ];
  }
}

function readPosts(): FeedPost[] {
  initializeSamplePosts();
  return feedPosts;
}

function writePosts(posts: FeedPost[]) {
  feedPosts = posts;
}

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") || "20");
    const offset = Number(request.nextUrl.searchParams.get("offset") || "0");

    const posts = readPosts();
    const sorted = [...posts].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    const paged = sorted.slice(offset, offset + limit);

    return NextResponse.json({ posts: paged, total: sorted.length });
  } catch (error) {
    console.error("GET /api/feed/posts error:", error);
    return NextResponse.json({ posts: [], total: 0 }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const imageUrl = typeof body.image_url === "string" ? body.image_url : undefined;

    if (!content) {
      return NextResponse.json({ error: "El contenido es requerido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

    let authData: any = { id: "anonymous", email: "user@tutormatch.local" };
    let userData: any = {};

    if (token) {
      try {
        const authResp = await fetch(`${API_URL}/auth/me`, {
          headers: authHeader as HeadersInit,
        });
        if (authResp.ok) {
          authData = await authResp.json().catch(() => authData);
        }
      } catch (e) {
        console.error("Auth fetch error:", e);
      }

      try {
        const userResp = await fetch(`${API_URL}/users/me`, {
          headers: authHeader as HeadersInit,
        });
        if (userResp.ok) {
          userData = await userResp.json().catch(() => ({}));
        }
      } catch (e) {
        console.error("User fetch error:", e);
      }
    }

    const post: FeedPost = {
      id: crypto.randomUUID(),
      author_id: String(authData.id || authData.user_id || "user"),
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      author_name: userData.display_name || userData.name || authData.display_name || authData.email?.split("@")[0] || "Usuario",
      author_avatar: userData.avatar_url || userData.profile_picture || undefined,
    };

    const posts = readPosts();
    posts.unshift(post);
    writePosts(posts);

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("POST /api/feed/posts error:", error);
    return NextResponse.json({ error: "Error al crear la publicación", details: String(error) }, { status: 500 });
  }
}
