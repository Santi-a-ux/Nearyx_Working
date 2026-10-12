import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { NGROK_SKIP_HEADERS } from "@/lib/ngrok";

const API_URL = process.env.INTERNAL_API_URL || "http://gateway:8000";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, { params }: Context) {
  const { path } = await params;
  const target = `${API_URL}/${path.join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = { ...NGROK_SKIP_HEADERS };
  for (const name of ["content-type", "accept", "authorization"]) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }
  if (!headers.authorization) {
    const token = (await cookies()).get("token")?.value;
    if (token) headers.authorization = `Bearer ${token}`;
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      cache: "no-store",
      redirect: "manual",
      ...(hasBody ? { duplex: "half" } : {}),
    } as RequestInit);

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);

    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ detail: "No se pudo contactar el gateway" }, { status: 502 });
  }
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };