import { config } from './config/env.js';
import { NominatimClient } from './infrastructure/clients/nominatimClient.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { GeoService } from './application/services/geo.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { GeoController } from './presentation/controllers/geo.controller.js';
import { createAuthenticate, noAuth } from './presentation/middlewares/authenticate.js';
import { createGeoRouter } from './presentation/routes/geo.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const geoService = new GeoService({ geocoder: new NominatimClient(config.nominatim) });
  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });

  const geoRouter = createGeoRouter({
    controller: new GeoController(geoService),
    // The Python service imported verify_token but never applied it, so routes were public.
    authenticate: config.requireAuth ? createAuthenticate(identityService) : noAuth,
  });

  return { geoRouter };
}
