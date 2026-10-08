import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { ProfileRepository } from './infrastructure/repositories/profile.repository.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { SupabaseStorage } from './infrastructure/storage/supabaseStorage.js';
import { ProfileService } from './application/services/profile.service.js';
import { ProfileImageService } from './application/services/profileImage.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { ProfileController } from './presentation/controllers/profile.controller.js';
import { ProfileImageController } from './presentation/controllers/profileImage.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createProfileRouter } from './presentation/routes/profile.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const profileRepository = new ProfileRepository(pool);
  const imageStorage = new SupabaseStorage(config.supabase);

  const profileService = new ProfileService({ profileRepository });
  const profileImageService = new ProfileImageService({ profileRepository, imageStorage });
  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });

  const profileRouter = createProfileRouter({
    profileController: new ProfileController(profileService),
    imageController: new ProfileImageController(profileImageService),
    authenticate: createAuthenticate(identityService),
  });

  return { profileRouter };
}
