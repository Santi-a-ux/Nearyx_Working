import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const response = await fetch(`${API_URL}/media/posts/${postId}/comments`, { cache: "no-store" });
  const data = await response.json().catch(() => ({ comments: [], total: 0 }));
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { postId } = await context.params;
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "Debes iniciar sesión para comentar" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const authHeader = { Authorization: `Bearer ${token}` };
  const [authResponse, profileResponse] = await Promise.all([
    fetch(`${API_URL}/auth/me`, { headers: authHeader }),
    fetch(`${API_URL}/users/me`, { headers: authHeader }),
  ]);
  const authData = authResponse.ok ? await authResponse.json().catch(() => ({})) : {};
  const profileData = profileResponse.ok ? await profileResponse.json().catch(() => ({})) : {};
  const response = await fetch(`${API_URL}/media/posts/${postId}/comments`, {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_id: postId,
      author_id: authData.id || authData.user_id,
      author_name:
        profileData.display_name || profileData.name || authData.display_name || authData.email?.split("@")[0] || "Usuario",
      author_avatar: profileData.avatar_url || profileData.profile_picture,
      content: typeof body.content === "string" ? body.content.trim() : "",
    }),
  });
  const data = await response.json().catch(() => ({}));
  return NextResponse.json(data, { status: response.status });
}
