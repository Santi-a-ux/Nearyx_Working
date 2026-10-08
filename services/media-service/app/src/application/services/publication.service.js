import { Publication } from '../../domain/entities/Publication.js';
import { ForbiddenError, PublicationNotFoundError } from '../../domain/errors/index.js';

export class PublicationService {
  constructor({ publicationRepository }) {
    this.publicationRepository = publicationRepository;
  }

  list(limit, offset) {
    return this.publicationRepository.list(limit, offset);
  }

  async get(publicationId) {
    const publication = await this.publicationRepository.findById(publicationId);
    if (!publication) throw new PublicationNotFoundError();
    return publication;
  }

  create(userId, data) {
    if (data.authorId !== userId) throw new ForbiddenError('Author does not match authenticated user');
    return this.publicationRepository.create(new Publication(data));
  }

  async update(userId, publicationId, changes) {
    const publication = await this.get(publicationId);
    if (!publication.isAuthoredBy(userId)) throw new ForbiddenError('Not authorized to update this publication');
    return this.publicationRepository.update(publicationId, changes);
  }

  async delete(userId, publicationId) {
    const publication = await this.get(publicationId);
    if (!publication.isAuthoredBy(userId)) throw new ForbiddenError('Not authorized to delete this publication');
    await this.publicationRepository.delete(publicationId);
  }
}
