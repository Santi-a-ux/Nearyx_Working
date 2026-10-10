import 'dotenv/config';

// En producción JWT_SECRET es obligatorio; el valor por defecto solo existe para desarrollo local.
function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('Missing required environment variable: JWT_SECRET');
  return 'supersecret_jwt_key_that_should_be_changed_in_prod';
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
    userAgent: process.env.NOMINATIM_USER_AGENT ?? 'TutoringPlatform/1.0',
  },
  jwt: {
    secret: jwtSecret(),
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  requireAuth: process.env.REQUIRE_AUTH === 'true',
};
