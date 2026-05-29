-- ─── INICIALIZACIÓN DE BASE DE DATOS TTP ──────────────────────────────────────
-- Este script se ejecuta automáticamente cuando el contenedor de PostgreSQL
-- arranca por primera vez. Crea los schemas separados por servicio (Database
-- per Service pattern) y habilita las extensiones necesarias.

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Habilitar PostGIS (para el Geo Service y Tutor Service)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Habilitar búsqueda de texto completo con unaccent
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ─── SCHEMAS POR SERVICIO ──────────────────────────────────────────────────────
-- Cada microservicio tiene su propio schema — nunca comparten tablas directamente.
-- La comunicación entre servicios ocurre via API, no via JOINs cross-schema.

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS tutors;
CREATE SCHEMA IF NOT EXISTS geo;
CREATE SCHEMA IF NOT EXISTS chat;
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS feed;
CREATE SCHEMA IF NOT EXISTS notifications;

-- ─── GRANTS ────────────────────────────────────────────────────────────────────
GRANT ALL PRIVILEGES ON SCHEMA auth TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA users TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA tutors TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA geo TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA chat TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA media TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA feed TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA notifications TO postgres;

-- Log de inicialización
DO $$
BEGIN
  RAISE NOTICE '✅ Base de datos TTP inicializada correctamente';
  RAISE NOTICE '   Schemas creados: auth, users, tutors, geo, chat, media, notifications';
  RAISE NOTICE '   Extensiones: uuid-ossp, postgis, unaccent, pg_trgm';
END $$;
