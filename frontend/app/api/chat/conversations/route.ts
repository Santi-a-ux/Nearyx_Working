import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/chat/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => []);

    if (response.status === 401) {
      const nextResponse = NextResponse.json({ error: "Session expired" }, { status: 401 });
      nextResponse.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
      return nextResponse;
    }

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}