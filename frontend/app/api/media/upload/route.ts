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

    const incoming = await request.formData();
    const file = incoming.get("file");
    const type = incoming.get("type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Archivo no recibido" }, { status: 400 });
    }

    const forwarded = new FormData();
    forwarded.append("file", file);
    forwarded.append("type", typeof type === "string" && type ? type : "post");

    const response = await fetch(`${API_URL}/media/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: forwarded,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : {};

    if (response.status === 401) {
      const expired = NextResponse.json({ error: "Sesión expirada. Inicia sesión de nuevo." }, { status: 401 });
      expired.cookies.set("token", "", {
        httpOnly: true,
        secure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === "true" : process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
        sameSite: "lax",
      });
      return expired;
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST /api/media/upload error:", error);
    return NextResponse.json({ error: "No se pudo cargar la imagen" }, { status: 502 });
  }
}
