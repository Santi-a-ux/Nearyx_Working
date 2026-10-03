import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8000),
  nominatim: {
    baseUrl: process.env.NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org',
    userAgent: process.env.NOMINATIM_USER_AGENT ?? 'TutoringPlatform/1.0',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'supersecret_jwt_key_that_should_be_changed_in_prod',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  requireAuth: process.env.REQUIRE_AUTH === 'true',
};
