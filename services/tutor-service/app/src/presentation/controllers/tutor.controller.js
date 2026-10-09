import { toTutorDto, toProfileInput } from '../dtos/tutor.dto.js';

export class TutorController {
  constructor(tutorProfileService) {
    this.service = tutorProfileService;
  }

  create = async (req, res) => {
    const profile = await this.service.createProfile(req.user.userId, toProfileInput(req.valid.body));
    res.status(201).json(toTutorDto(profile));
  };

  update = async (req, res) => {
    res.json(toTutorDto(await this.service.updateProfile(req.user.userId, toProfileInput(req.valid.body))));
  };

  getMine = async (req, res) => {
    res.json(toTutorDto(await this.service.getMine(req.user.userId)));
  };

  list = async (req, res) => {
    const q = req.valid.query;
    const { tutors, total } = await this.service.list({
      category: q.category || null,
      q: q.q,
      isAvailable: q.is_available ?? null,
      lat: q.lat,
      lng: q.lng,
      radius: q.radius,
      limit: q.limit,
      offset: q.offset,
    });
    res.json({ tutors: tutors.map(toTutorDto), total });
  };

  setAvailability = async (req, res) => {
    res.json(toTutorDto(await this.service.setAvailability(req.user.userId, req.valid.query.is_available)));
  };

  getByUserId = async (req, res) => {
    res.json(toTutorDto(await this.service.getByUserId(req.valid.params.user_id)));
  };
}
