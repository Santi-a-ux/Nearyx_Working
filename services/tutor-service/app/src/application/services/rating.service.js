import { BusinessRuleError, NotFoundError } from '../../domain/errors/index.js';

export class RatingService {
  constructor({ ratingRepository, profileRepository }) {
    this.ratingRepository = ratingRepository;
    this.profileRepository = profileRepository;
  }

  async get(tutorUserId, callerId) {
    await this.#requireTutor(tutorUserId);
    return this.ratingRepository.summaryFor(tutorUserId, callerId);
  }

  async rate(tutorUserId, raterUserId, { rating, comment }) {
    await this.#requireTutor(tutorUserId);
    if (raterUserId === tutorUserId) throw new BusinessRuleError('No puedes calificar tu propio perfil');

    await this.ratingRepository.upsert({ tutorUserId, raterUserId, rating, comment });
    return this.ratingRepository.summaryFor(tutorUserId, raterUserId);
  }

  async #requireTutor(tutorUserId) {
    if (!(await this.profileRepository.exists(tutorUserId))) throw new NotFoundError('Tutor not found');
  }
}
