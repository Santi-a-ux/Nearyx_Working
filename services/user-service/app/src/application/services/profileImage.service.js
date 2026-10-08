import {
  FileRequiredError,
  InvalidImageTypeError,
  ProfileNotFoundError,
} from '../../domain/errors/index.js';

export class ProfileImageService {
  constructor({ profileRepository, imageStorage }) {
    this.profileRepository = profileRepository;
    this.imageStorage = imageStorage;
  }

  async uploadAvatar(userId, file) {
    if (!file?.originalname || !file.buffer?.length) throw new FileRequiredError();

    const contentType = file.mimetype || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new InvalidImageTypeError();

    // The profile is checked before uploading (the Python service uploaded first, leaving orphan files).
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) throw new ProfileNotFoundError();

    const avatarUrl = await this.imageStorage.uploadImage({
      buffer: file.buffer,
      filename: file.originalname,
      folder: `users/${userId}/avatars`,
      contentType,
    });

    profile.avatarUrl = avatarUrl;
    await this.profileRepository.update(profile);
    return avatarUrl;
  }
}
