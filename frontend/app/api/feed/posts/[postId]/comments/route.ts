import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { addComment, findPost, readComments, type FeedComment } from "@/lib/feed-store";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const post = findPost(postId);

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    const comments = readComments(postId).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return NextResponse.json({ comments, total: comments.length });
  } catch (error) {
    console.error("GET /api/feed/posts/[postId]/comments error:", error);
    return NextResponse.json({ comments: [], total: 0 }, { status: 200 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { postId } = await context.params;
    const post = findPost(postId);

    if (!post) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Debes iniciar sesión para comentar" }, { status: 401 });
    }

    const authHeader = { Authorization: `Bearer ${token}` };
    let authData: { id?: string; user_id?: string; email?: string; display_name?: string } = {};
    let userData: { display_name?: string; name?: string; avatar_url?: string; profile_picture?: string } = {};

    try {
      const authResp = await fetch(`${API_URL}/auth/me`, { headers: authHeader });
      if (authResp.ok) {
        authData = await authResp.json().catch(() => ({}));
      }
    } catch (e) {
      console.error("Auth fetch error:", e);
    }

    try {
      const userResp = await fetch(`${API_URL}/users/me`, { headers: authHeader });
      if (userResp.ok) {
        userData = await userResp.json().catch(() => ({}));
      }
    } catch (e) {
      console.error("User fetch error:", e);
    }

    const comment: FeedComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author_id: String(authData.id || authData.user_id || "anonymous"),
      author_name:
        userData.display_name || userData.name || authData.display_name || authData.email?.split("@")[0] || "Usuario",
      author_avatar: userData.avatar_url || userData.profile_picture || undefined,
      content,
      created_at: new Date().toISOString(),
    };

    addComment(comment);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("POST /api/feed/posts/[postId]/comments error:", error);
    return NextResponse.json({ error: "Error al crear el comentario" }, { status: 500 });
  }
}
