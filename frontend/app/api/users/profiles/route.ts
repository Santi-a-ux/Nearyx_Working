import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const resp = await fetch(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
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

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
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

    const resp = await fetch(`${API_URL}/users/profiles/me`, {
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

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
