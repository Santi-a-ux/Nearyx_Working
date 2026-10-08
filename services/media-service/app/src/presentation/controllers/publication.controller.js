import { toPublicationDto, toPublicationInput, toPublicationChanges } from '../dtos/publication.dto.js';

export class PublicationController {
  constructor(publicationService) {
    this.publicationService = publicationService;
  }

  list = async (req, res) => {
    const { limit, offset } = req.valid.query;
    const { publications, total } = await this.publicationService.list(limit, offset);
    res.json({ posts: publications.map(toPublicationDto), total });
  };

  create = async (req, res) => {
    const publication = await this.publicationService.create(req.user.userId, toPublicationInput(req.valid.body));
    res.status(201).json(toPublicationDto(publication));
  };

  get = async (req, res) => {
    res.json(toPublicationDto(await this.publicationService.get(req.valid.params.publication_id)));
  };

  update = async (req, res) => {
    const publication = await this.publicationService.update(
      req.user.userId,
      req.valid.params.publication_id,
      toPublicationChanges(req.valid.body),
    );
    res.json(toPublicationDto(publication));
  };

  delete = async (req, res) => {
    await this.publicationService.delete(req.user.userId, req.valid.params.publication_id);
    res.json({ deleted: true });
  };
}
