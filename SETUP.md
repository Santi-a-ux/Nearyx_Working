# 🚀 Setup e Instalación - Nearyx

Guía mínima para arrancar el proyecto actual sin tocar el setup viejo.

## 1. Clona el repo

```bash
git clone https://github.com/Santi-a-ux/Nearyx_Working.git
cd Nearyx_Working
```

## 2. Crea solo dos archivos de entorno

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
INTERNAL_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8005
MAPBOX_PUBLIC_TOKEN=pk.tu_token_real
NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token_real
```

### `.env` en la raíz

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ttp
DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ttp
REDIS_URL=redis://redis:6379

JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
SUPABASE_KEY=tusupabasekey
INTERNAL_API_URL=http://gateway:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8005

MAPBOX_PUBLIC_TOKEN=pk.tu_token_real
NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token_real

MEDIA_LOCAL_ROOT=/media_files
```

## 3. Levanta el proyecto

Si quieres el frontend local:

```bash
cd frontend
npm install
npm run dev
```

Si quieres todo con Docker:

```bash
docker compose up -d --build
```

## Dónde entra cada cosa

- `frontend/.env.local` solo afecta `npm run dev` dentro de `frontend/`.
- `.env` raíz lo usa Docker Compose y el stack de servicios.
- El token de Mapbox debe ir en ambos archivos si vas a usar `/explore`.

## URLs

- Frontend: http://localhost:3000
- Gateway: http://localhost:8000
