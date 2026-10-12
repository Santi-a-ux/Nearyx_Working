import { NGROK_SKIP_HEADER } from "@/lib/ngrok";

// URL diferenciada: Server Side se comunica por red interna de docker, Client Side localmente.
export const API_URL = typeof window === "undefined" 
  ? process.env.INTERNAL_API_URL || "http://gateway:8000"
  : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const GATEWAY_PROXY_PATH = "/api/gw";

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const isInternalApiRoute = endpoint.startsWith("/api/");
  const headers = new Headers(options.headers);
  
  // Añadimos Content-Type json por defecto si no es FormData
  if (!headers.has("Content-Type") && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  // Ngrok interpone una página HTML de advertencia; este header la omite en llamadas directas
  if (!headers.has(NGROK_SKIP_HEADER)) {
    headers.set(NGROK_SKIP_HEADER, "1");
  }
  
  // Manejo de token mixto (funciona tanto para SSR como Cliente, evitando error next/headers nativo si se corre full cliente)
  let token = null;

  if (typeof window === "undefined") {
    // Server Side (NodeJs environment)
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      token = cookieStore.get("token")?.value;
    } catch {
      // ignore
    }
  } else {
    // Client Side (Browser environment)
    token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
  }

  if (token && !isInternalApiRoute) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // En el navegador, las llamadas al Gateway pasan por el proxy same-origin (/api/gw) para evitar CORS con Ngrok
  const targetUrl = isInternalApiRoute
    ? endpoint
    : typeof window === "undefined"
      ? `${API_URL}${endpoint}`
      : `${GATEWAY_PROXY_PATH}${endpoint}`;

  const response = await fetch(targetUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    let errorMessage = "Error en la petición";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // Ignorar error de parsing
    }
    throw new Error(errorMessage);
  }

  return response.json();
}