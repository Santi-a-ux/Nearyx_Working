# Nearyx — Plataforma de Expertos y Estudiantes

Arquitectura de microservicios para conectar estudiantes con expertos (mapa, feed, chat y reservas).

Repositorio de referencia: [Nearyx_Working](https://github.com/Santi-a-ux/Nearyx_Working)

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 + TypeScript + Tailwind + shadcn/ui |
| Backend | FastAPI + Python 3.12 |
| Base de datos | PostgreSQL 16 + PostGIS 3.4 |
| Cache | Redis 7 |
| Storage | Supabase Storage |
| Mapas | Mapbox GL JS |
| Email | Resend |
| Contenedores | Docker + docker-compose |

## Servicios

| Servicio | Puerto | Responsabilidad |
|----------|--------|----------------|
| Frontend | 3000 | Next.js app |
| API Gateway | 8000 | Routing, auth check, rate limiting |
| Auth Service | 8001 | JWT, registro, login |
| User Service | 8002 | Perfiles de usuario |
| Tutor Service | 8003 | Perfiles y disponibilidad de expertos |
| Geo Service | 8004 | Búsqueda geoespacial |
| Chat Service | 8005 | Mensajería en tiempo real |
| Media Service | 8006 | Upload de archivos |
| Booking Service | 8007 | Reservas de sesiones |

## Instalación rápida

### 1. Clonar y configurar

```bash
git clone https://github.com/Santi-a-ux/Nearyx_Working.git
cd Nearyx_Working
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Edita `.env` y `frontend/.env.local` con tus valores reales (sobre todo **Mapbox** y `JWT_SECRET`).

#### Mapbox (obligatorio para `/explore`)

1. Crea un token público en [Mapbox Access Tokens](https://account.mapbox.com/access-tokens/) (empieza por `pk.`).
2. En **`.env`** (raíz), asigna el **mismo** token a las dos variables:

   ```env
   MAPBOX_PUBLIC_TOKEN=pk.tu_token_aqui
   NEXT_PUBLIC_MAPBOX_TOKEN=pk.tu_token_aqui
   ```

3. Repite en `frontend/.env.local` si desarrollas sin Docker.
4. **Guarda** los archivos antes de levantar Docker (si el editor no guarda, el contenedor leerá valores viejos).

**No uses** placeholders como `your_mapbox_public_token` ni `tu_token_mapbox`.

Tras cambiar el token, reconstruye el frontend:

```bash
docker compose build frontend --no-cache
docker compose up -d --force-recreate frontend
```

Comprueba que el servidor ve el token:

```bash
curl http://localhost:3000/api/config/public
# Debe incluir "mapboxConfigured":true
```

### 2. Levantar infraestructura base

```bash
docker-compose up -d postgres redis
bash scripts/verify-step1.sh
```

### 3. Levantar todos los servicios

```bash
docker compose up --build -d
```

App: http://localhost:3000 — Mapa: http://localhost:3000/explore

### 4. Verificar health checks

```bash
curl http://localhost:8000/health  # Gateway
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Users
curl http://localhost:8003/health  # Tutors
curl http://localhost:8004/health  # Geo
curl http://localhost:8005/health  # Chat
curl http://localhost:8006/health  # Media
curl http://localhost:8007/health  # Bookings
```

### 5. Crear datos iniciales

Los datos de ejemplo se cargan automáticamente desde el frontend cuando abres la app por primera vez. 
Puedes crear nuevos usuarios en `/register` y completar perfil de experto en `/profile/me`.

## Desarrollo local (sin Docker)

Puedes correr cada servicio individualmente:

```bash
cd services/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Estructura del proyecto

Ver `AGENT.md` para la documentación completa de arquitectura, endpoints, modelos de datos y convenciones de código.

Guía visual (Fraunces + Geist, tokens shadcn): [`docs/design-system.md`](docs/design-system.md).

## Flujo principal de demo

1. Registro como estudiante → JWT
2. Registro como tutor → completar perfil (especialidades + ubicación)
3. Explorar tutores en lista y mapa (`/explore`)
4. Ver perfil de tutor (`/profile/:id`)
5. Iniciar chat → mensajes en tiempo real
6. Tutor actualiza disponibilidad

---

*Arquitectura objetivo documentada en `AGENT.md`*
