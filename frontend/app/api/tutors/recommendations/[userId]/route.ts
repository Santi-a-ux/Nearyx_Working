import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const token = (await cookies()).get("token")?.value;
  if (!token) return NextResponse.json({ error: "No session" }, { status: 401 });

  try {
    const { userId } = await params;
    const response = await fetch(`${API_URL}/tutors/recommendations/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el servicio de recomendaciones" }, { status: 502 });
  }
}