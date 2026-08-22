import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

function clearSessionResponse() {
  const response = NextResponse.json({ error: "Sesión expirada. Inicia sesión de nuevo." }, { status: 401 });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

export async function GET() {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const resp = await fetch(`${API_URL}/tutors/verification/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (resp.status === 401) return clearSessionResponse();

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const body = await request.json();

    const resp = await fetch(`${API_URL}/tutors/verification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (resp.status === 401) return clearSessionResponse();

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
