import { Comment } from '../../domain/entities/Comment.js';
import {
  CommentNotFoundError,
  ForbiddenError,
  PublicationNotFoundError,
} from '../../domain/errors/index.js';

export class CommentService {
  constructor({ commentRepository, publicationRepository }) {
    this.commentRepository = commentRepository;
    this.publicationRepository = publicationRepository;
  }

  async listByPost(postId) {
    await this.#requirePublication(postId);
    return this.commentRepository.listByPost(postId);
  }

  /** `data.postId` / `data.authorId` come from the body; they must match the URL and the token. */
  async create(userId, postId, data) {
    if (data.postId !== postId || data.authorId !== userId) {
      throw new ForbiddenError('Comment author or publication does not match');
    }
    await this.#requirePublication(postId);
    return this.commentRepository.create(new Comment(data));
  }

  async delete(userId, commentId) {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) throw new CommentNotFoundError();
    if (!comment.isAuthoredBy(userId)) throw new ForbiddenError('Not authorized to delete this comment');
    await this.commentRepository.delete(commentId);
  }

  async #requirePublication(postId) {
    if (!(await this.publicationRepository.findById(postId))) throw new PublicationNotFoundError();
  }
}
