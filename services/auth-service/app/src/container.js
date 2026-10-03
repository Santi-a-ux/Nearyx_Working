import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { UserRepository } from './infrastructure/repositories/user.repository.js';
import { RefreshTokenRepository } from './infrastructure/repositories/refreshToken.repository.js';
import { PasswordHasher } from './infrastructure/security/passwordHasher.js';
import { TokenProvider } from './infrastructure/security/tokenProvider.js';
import { AuthService } from './application/services/auth.service.js';
import { AuthController } from './presentation/controllers/auth.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createAuthRouter } from './presentation/routes/auth.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const authService = new AuthService({
    userRepository: new UserRepository(pool),
    refreshTokenRepository: new RefreshTokenRepository(pool),
    passwordHasher: new PasswordHasher(),
    tokenProvider: new TokenProvider(config.jwt),
  });

  const authRouter = createAuthRouter({
    controller: new AuthController(authService),
    authenticate: createAuthenticate(authService),
  });

  return { authRouter };
}
