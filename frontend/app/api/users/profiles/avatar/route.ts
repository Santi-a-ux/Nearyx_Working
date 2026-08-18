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

    const formData = await request.formData();
    const response = await fetch(`${API_URL}/users/profiles/avatar`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : {};

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

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
