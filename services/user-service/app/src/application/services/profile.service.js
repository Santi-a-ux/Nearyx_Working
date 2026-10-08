import { UserProfile } from '../../domain/entities/UserProfile.js';
import { ProfileAlreadyExistsError, ProfileNotFoundError } from '../../domain/errors/index.js';

export class ProfileService {
  constructor({ profileRepository }) {
    this.profileRepository = profileRepository;
  }

  async createProfile(userId, data) {
    if (await this.profileRepository.findByUserId(userId)) throw new ProfileAlreadyExistsError();
    return this.profileRepository.create(UserProfile.create({ userId, ...data }));
  }

  async getByUserId(userId) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError();
    return profile;
  }

  /** Upsert: the first update of a user without profile creates it ("Usuario" when no name is given). */
  async updateProfile(userId, changes) {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      return this.profileRepository.create(
        UserProfile.create({ userId, ...changes, displayName: changes.displayName || 'Usuario' }),
      );
    }
    return this.profileRepository.update(profile.applyChanges(changes));
  }
}
