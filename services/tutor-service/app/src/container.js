import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { TutorProfileRepository } from './infrastructure/repositories/tutorProfile.repository.js';
import { RatingRepository } from './infrastructure/repositories/rating.repository.js';
import { VerificationRepository } from './infrastructure/repositories/verification.repository.js';
import { NetworkRepository } from './infrastructure/repositories/network.repository.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { TransformersEmbedder } from './infrastructure/embeddings/transformersEmbedder.js';
import { TutorProfileService } from './application/services/tutorProfile.service.js';
import { RatingService } from './application/services/rating.service.js';
import { VerificationService } from './application/services/verification.service.js';
import { NetworkService } from './application/services/network.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { TutorController } from './presentation/controllers/tutor.controller.js';
import { RatingController } from './presentation/controllers/rating.controller.js';
import { VerificationController } from './presentation/controllers/verification.controller.js';
import { NetworkController } from './presentation/controllers/network.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createTutorRouter } from './presentation/routes/tutor.routes.js';

// Composition root: the only place where layers are wired together.
// `embedder` can be replaced (tests, scripts): it only needs embedPassage(text) and embedQuery(text).
export function buildContainer({ embedder = new TransformersEmbedder(config.embeddings) } = {}) {
  const profileRepository = new TutorProfileRepository(pool);
  const ratingRepository = new RatingRepository(pool);
  const verificationRepository = new VerificationRepository(pool);
  const networkRepository = new NetworkRepository(pool);

  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });

  const tutorRouter = createTutorRouter({
    tutorController: new TutorController(new TutorProfileService({ profileRepository, embedder })),
    ratingController: new RatingController(new RatingService({ ratingRepository, profileRepository })),
    verificationController: new VerificationController(new VerificationService({ verificationRepository, profileRepository })),
    networkController: new NetworkController(new NetworkService({ networkRepository })),
    authenticate: createAuthenticate(identityService),
  });

  return { tutorRouter, embedder, profileRepository };
}
