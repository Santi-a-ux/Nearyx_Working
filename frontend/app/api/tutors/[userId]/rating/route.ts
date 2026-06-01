import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

function clearSessionResponse(message = "Session expired") {
  const response = NextResponse.json({ error: message }, { status: 401 });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: false,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
  });
  return response;
}

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { userId } = await context.params;
    const response = await fetch(`${API_URL}/tutors/${userId}/rating`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      return clearSessionResponse();
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken();
    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const { userId } = await context.params;
    const body = await request.json();
    const response = await fetch(`${API_URL}/tutors/${userId}/rating`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401) {
      return clearSessionResponse();
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
