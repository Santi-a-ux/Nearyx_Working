import { getMapboxAccessToken } from "@/lib/mapbox-env";

export const dynamic = "force-dynamic";

/** Expone config pública al cliente cuando el bundle no incluyó NEXT_PUBLIC_* (p. ej. Docker sin rebuild). */
export async function GET() {
  const mapboxToken = getMapboxAccessToken();
  return Response.json({
    mapboxToken,
    mapboxConfigured: mapboxToken.length > 0,
  });
}
