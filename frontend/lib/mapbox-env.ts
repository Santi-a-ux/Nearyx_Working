const INVALID_MAPBOX_TOKENS = new Set([
  "your_mapbox_public_token",
  "tu_token_mapbox",
  "pk.your_mapbox_public_token",
]);

function normalizeEnvValue(value?: string | null): string {
  return (value ?? "").replace(/\r/g, "").trim();
}

/** Token público de Mapbox (pk.…); rechaza placeholders de plantillas. */
export function isValidMapboxToken(token?: string | null): boolean {
  const value = normalizeEnvValue(token);
  if (!value || INVALID_MAPBOX_TOKENS.has(value)) return false;
  return value.startsWith("pk.") && value.length >= 50;
}

export function pickMapboxToken(...candidates: Array<string | undefined | null>): string {
  for (const candidate of candidates) {
    if (isValidMapboxToken(candidate)) return normalizeEnvValue(candidate);
  }
  return "";
}

/**
 * Lee el token en el servidor.
 * Usa MAPBOX_PUBLIC_TOKEN (runtime en Docker) porque Next.js sustituye
 * NEXT_PUBLIC_* en build y el valor del contenedor no llega a las API routes.
 */
export function getMapboxAccessToken(): string {
  return pickMapboxToken(
    normalizeEnvValue(process.env.MAPBOX_PUBLIC_TOKEN),
    normalizeEnvValue(process.env.MAPBOX_ACCESS_TOKEN),
    normalizeEnvValue(process.env.MAPBOX_TOKEN),
    normalizeEnvValue(process.env.NEXT_PUBLIC_MAPBOX_TOKEN),
  );
}
