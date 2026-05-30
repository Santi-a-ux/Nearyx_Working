# 🚀 Setup e Instalación - TutorMatch Platform

Guía completa para instalar y ejecutar la plataforma de tutorías en otro computador.

## 📋 Requisitos Previos

- **Node.js**: v18 o superior
- **Python**: 3.9 o superior
- **Docker**: Última versión
- **Docker Compose**: v2.0 o superior
- **Git**: Para clonar el repositorio
- **PostgreSQL** (local, opcional - se ejecuta en Docker)

## 🔧 Instalación Paso a Paso

### 1️⃣ Clonar el Repositorio

```bash
cd C:\Users\tu_usuario\Desktop
git clone https://github.com/Santi-a-ux/TUTORING-PLATFORM.git
cd TUTORING-PLATFORM
```

### 2️⃣ Configurar Variables de Entorno

#### Frontend (.env.local)

```bash
cd frontend
echo NEXT_PUBLIC_API_GATEWAY=http://localhost:8000 > .env.local
echo NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_mapbox >> .env.local
echo NEXT_PUBLIC_WS_URL=ws://localhost:8002 >> .env.local
cd ..
```

#### Gateway (.env)

```bash
cd gateway
echo AUTH_SERVICE_URL=http://auth-service:8001 > .env
echo USER_SERVICE_URL=http://user-service:8002 >> .env
echo TUTOR_SERVICE_URL=http://tutor-service:8003 >> .env
echo BOOKING_SERVICE_URL=http://booking-service:8004 >> .env
echo CHAT_SERVICE_URL=http://chat-service:8005 >> .env
echo MEDIA_SERVICE_URL=http://media-service:8006 >> .env
echo GEO_SERVICE_URL=http://geo-service:8007 >> .env
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring >> .env
echo REDIS_URL=redis://redis:6379 >> .env
cd ..
```

#### Auth Service (.env)

```bash
cd services/auth-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
echo SECRET_KEY=tu_secret_key_aleatorio >> .env
echo ALGORITHM=HS256 >> .env
cd ../..
```

#### User Service (.env)

```bash
cd services/user-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
echo GATEWAY_URL=http://gateway:8000 >> .env
cd ../..
```

#### Tutor Service (.env)

```bash
cd services/tutor-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
echo GATEWAY_URL=http://gateway:8000 >> .env
cd ../..
```

#### Chat Service (.env)

```bash
cd services/chat-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
echo REDIS_URL=redis://redis:6379 >> .env
cd ../..
```

#### Booking Service (.env)

```bash
cd services/booking-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
cd ../..
```

#### Media Service (.env)

```bash
cd services/media-service
echo DATABASE_URL=postgresql://tutoring:tutoring@postgres:5432/tutoring > .env
cd ../..
```

#### Geo Service (.env)

```bash
cd services/geo-service
echo MAPBOX_TOKEN=tu_token_mapbox > .env
cd ../..
```

### 3️⃣ Instalar Dependencias del Frontend

```bash
cd frontend
npm install
cd ..
```

### 4️⃣ Levantar los Contenedores Docker

```bash
docker compose down
docker compose up --build -d
```

**Esperar 30-60 segundos para que todos los servicios se levanten correctamente.**

### 5️⃣ Ejecutar Migraciones de Base de Datos

```bash
# Auth Service
docker exec tutoring-platform-auth-service-1 alembic upgrade head

# Tutor Service
docker exec tutoring-platform-tutor-service-1 alembic upgrade head

# User Service
docker exec tutoring-platform-user-service-1 alembic upgrade head

# Chat Service
docker exec tutoring-platform-chat-service-1 alembic upgrade head

# Media Service
docker exec tutoring-platform-media-service-1 alembic upgrade head

# Booking Service
docker exec tutoring-platform-booking-service-1 alembic upgrade head
```

### 6️⃣ Seedear la Base de Datos

```bash
docker exec tutoring-platform-postgres-1 psql -U tutoring -d tutoring -f /scripts/seed.sql
```

### 7️⃣ Verificar que Todo Funciona

```bash
# Verificar logs
docker compose logs -f

# En otro terminal, probar el gateway
curl http://localhost:8000/health

# Probar servicios
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # User
curl http://localhost:8003/health  # Tutor
```

## 🌐 Acceder a la Aplicación

Una vez todo esté corriendo:

- **Frontend**: http://localhost:3000
- **Gateway API**: http://localhost:8000
- **Auth Service**: http://localhost:8001
- **User Service**: http://localhost:8002
- **Tutor Service**: http://localhost:8003
- **Booking Service**: http://localhost:8004
- **Chat Service**: http://localhost:8005
- **Media Service**: http://localhost:8006
- **Geo Service**: http://localhost:8007

## 📊 Datos de Prueba

La plataforma viene con 5 tutores preseteados en Medellín:

1. **David Ramírez López** - Programación (Python, Django, FastAPI)
2. **Isabella García Martínez** - Gastronomía (Cocina Colombiana, Repostería)
3. **Carlos Enrique Vega** - Música (Guitarra, Teoría Musical)
4. **Martina Rodríguez Acevedo** - Bienestar (Yoga, Meditación, Pilates)
5. **Sebastián Morales Londoño** - Fotografía (Fotografía Digital, Edición)

## 🐛 Solucionar Problemas

### Los puertos están ocupados

```bash
# Matar procesos en puertos específicos (Windows PowerShell)
Get-Process | Where-Object {$_.Id -eq (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess} | Stop-Process -Force
```

### Docker no se levanta correctamente

```bash
# Limpiar todo y empezar de nuevo
docker compose down -v
docker system prune -a
docker compose up --build -d
```

### Base de datos no migra

```bash
# Ver logs de un servicio específico
docker compose logs auth-service

# Intentar migración manual
docker exec tutoring-platform-auth-service-1 bash -c "cd /app && alembic upgrade head"
```

### Redis/PostgreSQL no responden

```bash
# Reiniciar servicios de base de datos
docker compose restart postgres redis

# Esperar 10 segundos e intentar de nuevo
Start-Sleep -Seconds 10
```

## 📦 Stack Tecnológico

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI (7 microservicios)
- **Base de Datos**: PostgreSQL con extensión PostGIS
- **Cache/Real-time**: Redis
- **Contenedores**: Docker & Docker Compose
- **Autenticación**: JWT
- **Mapas**: Mapbox

## ✨ Características Principales

- 🗺️ Búsqueda de tutores por geolocalización
- 💬 Chat en tiempo real con WebSocket
- 🎯 Sistema de reservas
- 📸 Carga de medios
- 🔐 Autenticación JWT segura
- 📱 Interfaz responsiva

## 🚨 Notas Importantes

1. **Token Mapbox**: Reemplaza `tu_token_mapbox` con tu token de Mapbox desde https://mapbox.com
2. **Secret Key**: Genera una secret key segura para JWT
3. **Puertos**: Asegúrate que los puertos 3000, 5432, 6379 y 8000-8007 estén disponibles
4. **RAM/CPU**: La plataforma requiere al menos 4GB RAM disponible para Docker

---

**¿Preguntas?** Revisa los logs: `docker compose logs -f [service_name]`
