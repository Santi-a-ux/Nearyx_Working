import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function GET(
  request: NextRequest
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    const url = new URL(request.nextUrl);
    const params = new URLSearchParams(url.searchParams);
    const forceMedellin = process.env.NEXT_PUBLIC_FORCE_MEDELLIN === '1';

    // Default to Medellín if no client-provided coordinates and flag is on
    if (forceMedellin) {
      if (!params.has("lat")) params.set("lat", "6.2442");
      if (!params.has("lng")) params.set("lng", "-75.5812");
    }

    const response = await fetch(`${API_URL}/tutors/?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (response.status === 401) {
      const responseBody = NextResponse.json({ error: "Session expired" }, { status: 401 });
      responseBody.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
      return responseBody;
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}