# TutorMatch — Plataforma de Tutores y Estudiantes

Arquitectura de microservicios orientados al dominio para conectar tutores y estudiantes.

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
| Tutor Service | 8003 | Perfiles y disponibilidad tutor |
| Geo Service | 8004 | Búsqueda geoespacial |
| Chat Service | 8005 | Mensajería en tiempo real |
| Media Service | 8006 | Upload de archivos |

## Instalación rápida

### 1. Clonar y configurar

```bash
git clone <repo>
cd tutoring-platform
cp .env.example .env
# Edita .env con tus credenciales reales
```

### 2. Levantar infraestructura base

```bash
docker-compose up -d postgres redis
bash scripts/verify-step1.sh
```

### 3. Levantar todos los servicios

```bash
docker-compose up --build
```

### 4. Verificar health checks

```bash
curl http://localhost:8000/health  # Gateway
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Users
curl http://localhost:8003/health  # Tutors
curl http://localhost:8004/health  # Geo
curl http://localhost:8005/health  # Chat
curl http://localhost:8006/health  # Media
```

### 5. Crear datos iniciales

Los datos de ejemplo se cargan automáticamente desde el frontend cuando abres la app por primera vez. 
Puedes crear nuevos usuarios registrándote en `/register` y crear perfiles de tutor en `/tutor/onboarding`.

## Desarrollo local (sin Docker)

Puedes correr cada servicio individualmente:

```bash
cd services/auth-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Estructura del proyecto

Ver `AGENT.md` para la documentación completa de arquitectura, endpoints, modelos de datos y convenciones de código.

## Flujo principal de demo

1. Registro como estudiante → JWT
2. Registro como tutor → completar perfil (especialidades + ubicación)
3. Explorar tutores en lista y mapa (`/explore`)
4. Ver perfil de tutor (`/profile/:id`)
5. Iniciar chat → mensajes en tiempo real
6. Tutor actualiza disponibilidad

---

*Arquitectura objetivo documentada en `AGENT.md`*
