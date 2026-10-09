import { toRatingDto } from '../dtos/tutor.dto.js';

export class RatingController {
  constructor(ratingService) {
    this.service = ratingService;
  }

  get = async (req, res) => {
    res.json(toRatingDto(await this.service.get(req.valid.params.user_id, req.user.userId)));
  };

  put = async (req, res) => {
    const summary = await this.service.rate(req.valid.params.user_id, req.user.userId, req.valid.body);
    res.json(toRatingDto(summary));
  };
}
