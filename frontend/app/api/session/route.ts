import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // First try to load extended user profile
    const profileResponse = await fetch(`${API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Also load auth user as reliable fallback
    const authResponse = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const authUser = authResponse.ok ? await authResponse.json() : null;

    if (authResponse.status === 401) {
      const response = NextResponse.json({ error: "Session expired" }, { status: 401 });
      response.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
      return response;
    }

    if (profileResponse.ok) {
      const userData = await profileResponse.json();
      return NextResponse.json({
        ...userData,
        email: authUser?.email,
        role: authUser?.role,
      });
    }

    if (authUser) {
      const emailName = typeof authUser.email === "string" ? authUser.email.split("@")[0] : "Usuario";
      return NextResponse.json({
        user_id: authUser.id,
        display_name: authUser.display_name || emailName,
        bio: "",
        avatar_url: "",
        location_name: "",
        email: authUser.email,
        role: authUser.role,
        profile_missing: true,
      });
    }

    return NextResponse.json({ error: "Failed to fetch user" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
