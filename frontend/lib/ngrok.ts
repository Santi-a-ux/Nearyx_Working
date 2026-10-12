/**
 * Ngrok (túneles gratuitos) responde con una página HTML de advertencia a las peticiones que parecen
 * de navegador. Enviar este header (cualquier valor) la omite.
 */
export const NGROK_SKIP_HEADER = "ngrok-skip-browser-warning";
export const NGROK_SKIP_HEADERS: Record<string, string> = { [NGROK_SKIP_HEADER]: "1" };