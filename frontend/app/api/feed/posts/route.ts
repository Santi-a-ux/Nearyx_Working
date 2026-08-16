import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  addComment,
  findPost,
  mapSessionRoleToFeedAuthorRole,
  readComments,
  readPosts,
  writePosts,
  type FeedComment,
  type FeedPost,
} from "@/lib/feed-store";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

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

    let authData: { id?: string; user_id?: string; email?: string; role?: string; display_name?: string } = {
      id: "anonymous",
      email: "user@nearyx.local",
    };
    let userData: { display_name?: string; name?: string; avatar_url?: string; profile_picture?: string; role?: string } =
      {};

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

    const sessionRole = authData.role || userData.role;
    const bodyRole = typeof body.author_role === "string" ? body.author_role : undefined;

    const post: FeedPost = {
      id: crypto.randomUUID(),
      author_id: String(authData.id || authData.user_id || "user"),
      content,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
      author_name:
        userData.display_name || userData.name || authData.display_name || authData.email?.split("@")[0] || "Usuario",
      author_avatar: userData.avatar_url || userData.profile_picture || undefined,
      author_role:
        mapSessionRoleToFeedAuthorRole(sessionRole) || mapSessionRoleToFeedAuthorRole(bodyRole) || undefined,
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

export type { FeedComment, FeedPost };
