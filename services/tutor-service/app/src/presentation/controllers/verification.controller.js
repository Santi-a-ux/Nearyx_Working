import { toVerificationDto, toPublicVerificationDto, toVerificationInput } from '../dtos/verification.dto.js';

export class VerificationController {
  constructor(verificationService) {
    this.service = verificationService;
  }

  submit = async (req, res) => {
    const created = await this.service.submit(req.user.userId, toVerificationInput(req.valid.body));
    res.status(201).json(toVerificationDto(created));
  };

  getMine = async (req, res) => {
    res.json(toVerificationDto(await this.service.getMine(req.user.userId)));
  };

  list = async (req, res) => {
    const { status, limit, offset } = req.valid.query;
    // Same as FastAPI's Query('pending'): absent -> pending, empty -> no filter.
    const statusFilter = status === undefined ? 'pending' : status || null;
    const { requests, total } = await this.service.list(statusFilter, limit, offset);
    res.json({ requests: requests.map(toVerificationDto), total });
  };

  review = async (req, res) => {
    const reviewed = await this.service.review(req.user.userId, req.valid.params.request_id, {
      status: req.valid.body.status,
      reviewNotes: req.valid.body.review_notes,
    });
    res.json(toVerificationDto(reviewed));
  };

  getPublic = async (req, res) => {
    res.json(toPublicVerificationDto(await this.service.getPublic(req.valid.params.user_id)));
  };
}
