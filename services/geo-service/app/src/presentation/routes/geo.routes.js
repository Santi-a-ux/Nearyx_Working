import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { geocodeQuerySchema, reverseGeocodeQuerySchema } from '../schemas/geo.schemas.js';

export function createGeoRouter({ controller, authenticate }) {
  const router = Router();

  router.get('/geocode', authenticate, validate('query', geocodeQuerySchema), controller.geocode);
  router.get('/reverse-geocode', authenticate, validate('query', reverseGeocodeQuerySchema), controller.reverseGeocode);

  return router;
}
