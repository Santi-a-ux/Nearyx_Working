import { TutorProfile } from '../../domain/entities/TutorProfile.js';
import { buildProfileText } from '../../domain/profileText.js';
import { BusinessRuleError, EmbeddingUnavailableError, NotFoundError } from '../../domain/errors/index.js';

export class TutorProfileService {
  constructor({ profileRepository, embedder }) {
    this.profileRepository = profileRepository;
    this.embedder = embedder;
  }

  async createProfile(userId, data) {
    if (await this.profileRepository.findByUserId(userId)) throw new BusinessRuleError('Profile already exists');

    const profile = TutorProfile.create({ userId, ...data });
    const { embedding } = await this.#embedProfile(profile);
    return this.profileRepository.create(profile, embedding ?? null);
  }

  async updateProfile(userId, changes) {
    const profile = await this.#requireProfile(userId, 'Profile not found');
    const { coordinatesChanged, profileTextChanged } = profile.applyChanges(changes);

    // The embedding is recomputed only when specialties/categories changed. If the model is down the old
    // embedding is kept (it would otherwise be wiped); `npm run backfill:embeddings` fixes it later.
    const { ok, embedding } = profileTextChanged ? await this.#embedProfile(profile) : { ok: false };
    return this.profileRepository.update(profile, {
      coordinatesChanged,
      embeddingChanged: profileTextChanged && ok,
      embedding: embedding ?? null,
    });
  }

  getMine(userId) {
    return this.#requireProfile(userId, 'Profile not found');
  }

  getByUserId(userId) {
    return this.#requireProfile(userId, 'Tutor not found');
  }

  async setAvailability(userId, isAvailable) {
    const profile = await this.profileRepository.setAvailability(userId, isAvailable);
    if (!profile) throw new NotFoundError('Profile not found');
    return profile;
  }

  /**
   * Three modes, as in the Python service:
   *  1. `q`: semantic search (category is ignored; availability and radius still apply),
   *  2. lat + lng + radius: nearest first,
   *  3. plain listing with total.
   * In 1 and 2 `total` is the size of the returned page, not of the whole result set.
   */
  async list({ category, q, isAvailable, lat, lng, radius, limit, offset }) {
    const embedding = q ? await this.embedder.embedQuery(q) : null;

    if (embedding) {
      const tutors = await this.profileRepository.searchSemantic({
        embedding, isAvailable, geo: { lat, lng, radius }, limit, offset,
      });
      return { tutors, total: tutors.length };
    }

    if (lat != null && lng != null && radius != null) {
      const tutors = await this.profileRepository.searchNearby({ category, isAvailable, lat, lng, radius, limit, offset });
      return { tutors, total: tutors.length };
    }

    return this.profileRepository.listAll({ category, isAvailable, limit, offset });
  }

  async #requireProfile(userId, notFoundMessage) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new NotFoundError(notFoundMessage);
    return profile;
  }

  async #embedProfile(profile) {
    try {
      return { ok: true, embedding: await this.embedder.embedPassage(buildProfileText(profile.specialties, profile.categories)) };
    } catch (err) {
      if (!(err instanceof EmbeddingUnavailableError)) throw err;
      console.error(`[tutor-service] embedding skipped for ${profile.userId}: ${err.message}`);
      return { ok: false, embedding: null };
    }
  }
}
