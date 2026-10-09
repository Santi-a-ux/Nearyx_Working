import { VERIFICATION_REVIEW_STATUSES } from '../../domain/searchPolicy.js';
import { BusinessRuleError, NotFoundError } from '../../domain/errors/index.js';

const PROFILE_STATUS_BY_REVIEW = { approved: 'verified', rejected: 'rejected' };

export class VerificationService {
  constructor({ verificationRepository, profileRepository }) {
    this.verificationRepository = verificationRepository;
    this.profileRepository = profileRepository;
  }

  async submit(userId, data) {
    if (!(await this.profileRepository.exists(userId))) {
      throw new NotFoundError('Primero debes completar tu perfil de experto');
    }
    const latest = await this.verificationRepository.findLatest(userId);
    if (latest?.status === 'pending') throw new BusinessRuleError('Ya tienes una solicitud de verificación en revisión');
    if (latest?.status === 'approved') throw new BusinessRuleError('Tu perfil ya está verificado');

    return this.verificationRepository.createWithDocuments(userId, data);
  }

  async getMine(userId) {
    const request = await this.verificationRepository.findLatest(userId);
    if (!request) throw new NotFoundError('No has enviado una solicitud de verificación');
    return this.#withDocuments(request);
  }

  async list(status, limit, offset) {
    const { requests, total } = await this.verificationRepository.list(status, limit, offset);
    const documents = await this.verificationRepository.documentsByRequest(requests.map((r) => r.id));
    return { requests: requests.map((request) => ({ request, documents: documents[request.id] ?? [] })), total };
  }

  async review(adminId, requestId, { status, reviewNotes }) {
    if (!VERIFICATION_REVIEW_STATUSES.includes(status)) {
      throw new BusinessRuleError('Estado inválido. Debe ser approved o rejected');
    }
    const notes = (reviewNotes ?? '').trim();
    if (status === 'rejected' && !notes) throw new BusinessRuleError('Debes indicar el motivo del rechazo');

    const existing = await this.verificationRepository.findById(requestId);
    if (!existing) throw new NotFoundError('Solicitud no encontrada');
    if (existing.status !== 'pending') throw new BusinessRuleError('Esta solicitud ya fue revisada');

    // Conditional update: if another admin reviewed it in between, nothing is written.
    const reviewed = await this.verificationRepository.review(requestId, {
      status,
      notes: notes || null,
      reviewerId: adminId,
      profileStatus: PROFILE_STATUS_BY_REVIEW[status],
    });
    if (!reviewed) throw new BusinessRuleError('Esta solicitud ya fue revisada');
    return this.#withDocuments(reviewed);
  }

  /** Approved data for the public profile (documents are never exposed here). */
  async getPublic(userId) {
    const request = await this.verificationRepository.findLatest(userId, 'approved');
    if (!request) throw new NotFoundError('Este experto no tiene verificación aprobada');
    return request;
  }

  async #withDocuments(request) {
    const documents = await this.verificationRepository.documentsByRequest([request.id]);
    return { request, documents: documents[request.id] ?? [] };
  }
}
