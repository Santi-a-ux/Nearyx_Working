# Despliegue del back: Render (servicios) + Vercel/Render (gateway) + Supabase

Solo para pruebas y presentaciones: lo demás del tiempo queda apagado.

## Cómo funciona el "encendido"
- Un servicio gratis de Render **se duerme solo** a los 15 min sin tráfico. No hay que apagar nada: basta con **no hacer ping**.
- Las 750 horas gratis al mes son **por workspace**: con los 7 servicios de Render despiertos se gastan 7 h por hora de reloj (~100 h de reloj al mes). Mira el consumo en Billing.
- Un solo ping al gateway (`/wake`) despierta a todos los demás.
- El gateway en **Vercel** no se duerme (solo los servicios de Render).

## 0. Antes de empezar
1. **Rota** la `service_role` de Supabase, la contraseña de la DB y genera un `JWT_SECRET` nuevo (`openssl rand -hex 32`). El mismo `JWT_SECRET` en TODOS los servicios.
2. Supabase: extensiones `postgis` y `vector` habilitadas; bucket `tempoimages` creado.
3. Región de Render: **Virginia** u **Ohio** (cerca del pooler `us-east-1` de Supabase).

## 1. Embeddings en `q8` (cabe mejor en 512 MB) y recalcular
Todo debe usar el mismo dtype porque los vectores `q8` y `fp32` no son idénticos:
```bash
# .env local
EMBEDDING_DTYPE=q8
docker compose up -d --force-recreate tutor-service
docker compose exec tutor-service npm run backfill:embeddings -- --all
docker compose exec tutor-service npm run calibrate:search     # debe decir "Separable"
```
Si sugiere otro valor, úsalo en `SEMANTIC_MIN_SEPARATION` (local y Render).

## 2. Redis (solo chat-service)
Upstash (gratis) o Key Value de Render. Copia la URL `rediss://...` **sin** `/1` al final. Verifica los límites del plan.

## 3. Servicios en Render (New → Web Service → mismo repo)
Para cada uno: **Runtime = Docker**, plan **Free**, y estos campos (rutas desde la raíz del repo):

| Servicio | Docker Build Context | Dockerfile Path | Variables propias |
|---|---|---|---|
| auth | `services/auth-service` | `services/auth-service/Dockerfile` | — |
| users | `services/user-service` | `services/user-service/Dockerfile` | `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET=tempoimages` |
| tutors | `services/tutor-service` | `services/tutor-service/Dockerfile.render` | `EMBEDDING_DTYPE=q8`, `BACKFILL_EMBEDDINGS_ON_START=false`, `SEMANTIC_MIN_SEPARATION=0.025`, `SEMANTIC_RELATIVE_MARGIN=0.03`, `SEMANTIC_ABSOLUTE_CEILING=0.22` |
| geo | `services/geo-service` | `services/geo-service/Dockerfile` | `NOMINATIM_USER_AGENT` (tu app + correo) |
| chat | `services/chat-service` | `services/chat-service/Dockerfile` | `REDIS_URL` |
| bookings | `services/booking-service` | `services/booking-service/Dockerfile` | — |
| media | `services/media-service` | `services/media-service/Dockerfile` | `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_BUCKET=tempoimages` |

Variables comunes (créalas una vez como **Environment Group** y enlázalo a cada servicio; geo solo necesita `JWT_SECRET`):
`NODE_ENV=production`, `JWT_SECRET`, `JWT_ALGORITHM=HS256`, `DATABASE_URL` (pooler de Supabase, puerto 6543), `PG_POOL_MAX=3`.
Health Check Path: `/health`. Auto-Deploy: **No** (ahorra minutos de build).

## 4. Gateway
Variables (en Vercel o Render):
```
AUTH_SERVICE_URL=https://<auth>.onrender.com
USER_SERVICE_URL=https://<users>.onrender.com
TUTOR_SERVICE_URL=https://<tutors>.onrender.com
GEO_SERVICE_URL=https://<geo>.onrender.com
CHAT_SERVICE_URL=https://<chat>.onrender.com
MEDIA_SERVICE_URL=https://<media>.onrender.com
BOOKING_SERVICE_URL=https://<bookings>.onrender.com
WAKE_KEY=<clave larga aleatoria>
GATEWAY_TIMEOUT_MS=55000          # en Vercel (< maxDuration 60 s); en Render puedes usar 120000
CORS_ORIGINS=https://tu-app.vercel.app   # cuando exista el front
```
> La URL de media ya **no está en el código**: ponla en `MEDIA_SERVICE_URL` (en tu `.env` local también, si usas el media de Render).

- **Gateway en Vercel** (ya tienes `gateway/app/api/index.js`): proyecto con *Root Directory* `gateway/app`. Se añadió `gateway/app/vercel.json` (todas las rutas → la función, `maxDuration` 60). **Vercel no soporta WebSocket**: el chat debe conectarse directo al chat-service → en el front `NEXT_PUBLIC_WS_URL=wss://<chat>.onrender.com` (la ruta del servicio es `/chat/ws/<id>`). Prueba un `POST /auth/login` real para confirmar que el cuerpo llega bien.
- **Gateway en Render**: Docker, `gateway/Dockerfile`, contexto `gateway`; ahí sí funciona el WebSocket.

## 5. Probar
```bash
curl "https://<gateway>/wake?key=<WAKE_KEY>"
```
Debe devolver `"ok": true` con los 7 servicios y `db` (la primera vez tarda ~1 min por el arranque en frío).

## 6. Pings (cron-job.org o UptimeRobot, gratis)
| Job | URL | Frecuencia | Cuándo |
|---|---|---|---|
| Despertar | `https://<gateway>/wake?key=<WAKE_KEY>` | cada 10 min | solo en pruebas/presentaciones (actívalo ~10 min antes, desactívalo al terminar) |
| Mantener Supabase | `https://<gateway>/wake?mode=db&key=<WAKE_KEY>` | cada 3-5 días | siempre (Supabase pausa los proyectos gratis tras 7 días sin actividad) |

El primer ping a un servicio dormido puede dar timeout en el cron (30 s): es normal, el servicio igual despierta.

## 7. Si el tutor-service se queda sin memoria (OOM)
Render lo muestra en *Events*. Sube **solo ese servicio** a un plan de pago con más RAM (se cobra por segundo y puedes suspenderlo; verifica precios).

## Limitaciones conocidas
- Los servicios de Render son **públicos** (sin red privada en free). Cada uno valida el JWT; antes de producción conviene una clave interna compartida gateway → servicios.
- Primer request tras dormir: ~1 min por servicio. Usa `/wake` antes de demostrar.
