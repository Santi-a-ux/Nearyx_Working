import { Router } from 'express';
import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { PublicationRepository } from './infrastructure/repositories/publication.repository.js';
import { CommentRepository } from './infrastructure/repositories/comment.repository.js';
import { FileMetadataRepository } from './infrastructure/repositories/fileMetadata.repository.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { SupabaseStorage } from './infrastructure/storage/supabaseStorage.js';
import { PublicationService } from './application/services/publication.service.js';
import { CommentService } from './application/services/comment.service.js';
import { MediaService } from './application/services/media.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { PublicationController } from './presentation/controllers/publication.controller.js';
import { CommentController } from './presentation/controllers/comment.controller.js';
import { MediaController } from './presentation/controllers/media.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createPublicationRouter } from './presentation/routes/publication.routes.js';
import { createCommentRouter } from './presentation/routes/comment.routes.js';
import { createMediaRouter } from './presentation/routes/media.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const publicationRepository = new PublicationRepository(pool);
  const commentRepository = new CommentRepository(pool);
  const fileMetadataRepository = new FileMetadataRepository(pool);
  const fileStorage = new SupabaseStorage(config.supabase);

  const publicationService = new PublicationService({ publicationRepository });
  const commentService = new CommentService({ commentRepository, publicationRepository });
  const mediaService = new MediaService({ fileMetadataRepository, fileStorage });
  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });
  const authenticate = createAuthenticate(identityService);

  // Order matters (as in main.py): posts, comments, then the file routes with `/:file_id`.
  const mediaRouter = Router();
  mediaRouter.use(createPublicationRouter({ controller: new PublicationController(publicationService), authenticate }));
  mediaRouter.use(createCommentRouter({ controller: new CommentController(commentService), authenticate }));
  mediaRouter.use(createMediaRouter({ controller: new MediaController(mediaService), authenticate }));

  return { mediaRouter };
}
