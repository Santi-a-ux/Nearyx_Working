import { toProfileDto, toProfileInput } from '../dtos/profile.dto.js';

export class ProfileController {
  constructor(profileService) {
    this.profileService = profileService;
  }

  create = async (req, res) => {
    const profile = await this.profileService.createProfile(req.user.userId, toProfileInput(req.valid.body));
    res.status(201).json(toProfileDto(profile));
  };

  getMine = async (req, res) => {
    res.json(toProfileDto(await this.profileService.getByUserId(req.user.userId)));
  };

  updateMine = async (req, res) => {
    const profile = await this.profileService.updateProfile(req.user.userId, toProfileInput(req.valid.body));
    res.json(toProfileDto(profile));
  };

  getByUserId = async (req, res) => {
    res.json(toProfileDto(await this.profileService.getByUserId(req.valid.params.user_id)));
  };
}
