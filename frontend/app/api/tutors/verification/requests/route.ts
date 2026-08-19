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

    const status = request.nextUrl.searchParams.get("status") || "pending";

    const resp = await fetch(`${API_URL}/tutors/verification/requests?status=${encodeURIComponent(status)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (resp.status === 401) {
      const expired = NextResponse.json({ error: "Sesión expirada. Inicia sesión de nuevo." }, { status: 401 });
      expired.cookies.set("token", "", {
        httpOnly: true,
        secure: false,
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
      return expired;
    }

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
