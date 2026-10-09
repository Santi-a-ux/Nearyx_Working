import { toNetworkDto } from '../dtos/tutor.dto.js';

export class NetworkController {
  constructor(networkService) {
    this.service = networkService;
  }

  recommendations = async (req, res) => {
    res.json(toNetworkDto(await this.service.buildGraph(req.valid.params.user_id)));
  };
}
