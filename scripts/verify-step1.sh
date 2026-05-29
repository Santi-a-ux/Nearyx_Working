#!/usr/bin/env bash
# scripts/verify-step1.sh
# Verifica que la infraestructura base del Paso 1 está lista
# Uso: bash scripts/verify-step1.sh

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║   TTP — Verificación Paso 1: Infraestructura base    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# 1. Verificar que .env existe
echo "1. Verificando archivo .env..."
if [ -f ".env" ]; then
    echo -e "   ${GREEN}✅ .env encontrado${NC}"
else
    echo -e "   ${RED}❌ .env no encontrado. Copia .env.example a .env y configura las variables${NC}"
    echo "   Comando: cp .env.example .env"
    exit 1
fi

# 2. Verificar variables críticas en .env
echo "2. Verificando variables críticas..."
REQUIRED_VARS=("POSTGRES_USER" "POSTGRES_PASSWORD" "JWT_SECRET" "REDIS_URL")
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        echo -e "   ${GREEN}✅ ${var} definida${NC}"
    else
        echo -e "   ${RED}❌ ${var} no encontrada en .env${NC}"
        exit 1
    fi
done

# 3. Verificar que Docker está corriendo
echo "3. Verificando Docker..."
if docker info > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Docker está corriendo${NC}"
else
    echo -e "   ${RED}❌ Docker no está corriendo. Inicia Docker Desktop${NC}"
    exit 1
fi

# 4. Levantar postgres y redis
echo "4. Levantando PostgreSQL y Redis..."
docker-compose up -d postgres redis

echo "   Esperando health checks (30s máx)..."
sleep 5

# 5. Verificar PostgreSQL
echo "5. Verificando PostgreSQL..."
MAX_RETRIES=10
COUNT=0
until docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; do
    COUNT=$((COUNT+1))
    if [ $COUNT -ge $MAX_RETRIES ]; then
        echo -e "   ${RED}❌ PostgreSQL no respondió después de ${MAX_RETRIES} intentos${NC}"
        docker-compose logs postgres | tail -20
        exit 1
    fi
    echo "   Esperando PostgreSQL... ($COUNT/$MAX_RETRIES)"
    sleep 3
done
echo -e "   ${GREEN}✅ PostgreSQL listo${NC}"

# 6. Verificar PostGIS
echo "6. Verificando extensión PostGIS..."
POSTGIS_VERSION=$(docker-compose exec -T postgres psql -U postgres -d ttp -c "SELECT PostGIS_Version();" 2>/dev/null | grep -E "[0-9]+\.[0-9]+" | head -1 | xargs)
if [ -n "$POSTGIS_VERSION" ]; then
    echo -e "   ${GREEN}✅ PostGIS disponible: ${POSTGIS_VERSION}${NC}"
else
    echo -e "   ${YELLOW}⚠️  PostGIS aún no inicializado (se inicializará con init-db.sql)${NC}"
fi

# 7. Verificar schemas creados
echo "7. Verificando schemas de base de datos..."
SCHEMAS=("auth" "users" "tutors" "geo" "chat" "media")
for schema in "${SCHEMAS[@]}"; do
    EXISTS=$(docker-compose exec -T postgres psql -U postgres -d ttp -tAc "SELECT schema_name FROM information_schema.schemata WHERE schema_name='${schema}';" 2>/dev/null | xargs)
    if [ "$EXISTS" = "$schema" ]; then
        echo -e "   ${GREEN}✅ Schema '${schema}' creado${NC}"
    else
        echo -e "   ${YELLOW}⚠️  Schema '${schema}' no encontrado aún (se creará en el siguiente paso)${NC}"
    fi
done

# 8. Verificar Redis
echo "8. Verificando Redis..."
REDIS_PING=$(docker-compose exec -T redis redis-cli ping 2>/dev/null | xargs)
if [ "$REDIS_PING" = "PONG" ]; then
    echo -e "   ${GREEN}✅ Redis respondió PONG${NC}"
else
    echo -e "   ${RED}❌ Redis no respondió${NC}"
    docker-compose logs redis | tail -10
    exit 1
fi

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo -e "║   ${GREEN}✅ PASO 1 COMPLETADO — Infraestructura lista${NC}         ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║   PostgreSQL: localhost:5432                         ║"
echo "║   Redis:      localhost:6379                         ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║   Siguiente: Paso 2 — Auth Service                   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
