import { isValidRole } from '../../domain/entities/roles.js';
import {
  InvalidRoleError,
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  InvalidTokenError,
  InactiveUserError,
  InvalidRefreshTokenError,
  ExpiredRefreshTokenError,
} from '../../domain/errors/index.js';

export class AuthService {
  constructor({ userRepository, refreshTokenRepository, passwordHasher, tokenProvider }) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
    this.passwordHasher = passwordHasher;
    this.tokenProvider = tokenProvider;
  }

  async register({ email, password, role }) {
    if (!isValidRole(role)) throw new InvalidRoleError();
    if (await this.userRepository.findByEmail(email)) throw new EmailAlreadyRegisteredError();

    const user = await this.userRepository.create({
      email,
      passwordHash: await this.passwordHasher.hash(password),
      role,
    });
    return this.#issueSession(user);
  }

  async login({ email, password }) {
    const user = await this.userRepository.findByEmail(email);
    if (!user || !(await this.passwordHasher.verify(password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }
    return this.#issueSession(user);
  }

  async refresh(refreshToken) {
    const payload = this.tokenProvider.decode(refreshToken);
    if (!payload || payload.type !== 'refresh') throw new InvalidRefreshTokenError();

    const userId = payload.sub;
    const stored = await this.refreshTokenRepository.findByUserId(userId);

    let validToken = null;
    for (const token of stored) {
      if (!token.isExpired() && (await this.passwordHasher.verify(refreshToken, token.tokenHash))) {
        validToken = token;
        break;
      }
    }
    if (!validToken) throw new ExpiredRefreshTokenError();

    const user = await this.userRepository.findById(userId);
    if (!user) throw new InvalidRefreshTokenError();

    const accessToken = this.tokenProvider.createAccessToken(user.id, user.role);
    const { token: newRefreshToken, expiresAt } = this.tokenProvider.createRefreshToken(user.id);

    await this.refreshTokenRepository.replace(validToken.id, {
      userId: user.id,
      tokenHash: await this.passwordHasher.hash(newRefreshToken),
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(user) {
    await this.refreshTokenRepository.deleteByUserId(user.id);
  }

  verifyToken(token) {
    const payload = this.tokenProvider.decode(token);
    if (!payload) return { valid: false, userId: null, role: null };
    return { valid: true, userId: String(payload.sub), role: payload.role ?? null };
  }

  getWsToken(user) {
    return this.tokenProvider.createAccessToken(user.id, user.role);
  }

  async promoteToTutor(user) {
    if (user.role !== 'tutor') {
      user.promoteToTutor();
      await this.userRepository.updateRole(user.id, user.role);
    }
    return {
      accessToken: this.tokenProvider.createAccessToken(user.id, user.role),
      role: user.role,
    };
  }

  /** Resolves the user behind a bearer access token (used by the auth middleware). */
  async authenticate(token) {
    const payload = this.tokenProvider.decode(token);
    if (!payload || !payload.sub) throw new InvalidTokenError();

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw new InactiveUserError();
    return user;
  }

  async #issueSession(user) {
    const accessToken = this.tokenProvider.createAccessToken(user.id, user.role);
    const { token: refreshToken, expiresAt } = this.tokenProvider.createRefreshToken(user.id);

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: await this.passwordHasher.hash(refreshToken),
      expiresAt,
    });
    return { accessToken, refreshToken, user };
  }
}
