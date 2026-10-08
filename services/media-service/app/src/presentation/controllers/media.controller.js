import { toFileDto, toUploadDto } from '../dtos/media.dto.js';

export class MediaController {
  constructor(mediaService) {
    this.mediaService = mediaService;
  }

  upload = async (req, res) => {
    const stored = await this.mediaService.upload(req.user.userId, { file: req.file, type: req.body.type });
    res.json(toUploadDto(stored));
  };

  // Express 5 gives a wildcard as an array of path segments.
  redirectToContent = async (req, res) => {
    const objectPath = [].concat(req.params.file_path).join('/');
    res.redirect(307, this.mediaService.contentUrl(objectPath));
  };

  getMetadata = async (req, res) => {
    res.json(toFileDto(await this.mediaService.getMetadata(req.valid.params.file_id)));
  };

  delete = async (req, res) => {
    await this.mediaService.delete(req.user.userId, req.valid.params.file_id);
    res.json({ deleted: true });
  };
}
