import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await request.json();

    const roleResponse = await fetch(`${API_URL}/auth/promote-to-tutor`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const roleData = await roleResponse.json().catch(() => ({}));

    if (roleResponse.status === 401) {
      const response = NextResponse.json(
        { error: "Sesión expirada. Inicia sesión de nuevo." },
        { status: 401 }
      );

      response.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });

      return response;
    }

    if (!roleResponse.ok) {
      return NextResponse.json(roleData, { status: roleResponse.status });
    }

    const updatedToken = roleData.access_token || token;

    const profileResponse = await fetch(`${API_URL}/tutors/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${updatedToken}`,
      },
      body: JSON.stringify(body),
    });

    const profileData = await profileResponse.json().catch(() => ({}));

    if (profileResponse.status === 401) {
      const response = NextResponse.json(
        { error: "Sesión expirada. Inicia sesión de nuevo." },
        { status: 401 }
      );

      response.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });

      return response;
    }

    const response = profileResponse.ok
      ? NextResponse.json(profileData, { status: profileResponse.status })
      : NextResponse.json(profileData, { status: profileResponse.status });

    response.cookies.set("token", updatedToken, {
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await request.json();

    const resp = await fetch(`${API_URL}/tutors/profiles`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (resp.status === 401) {
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

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}