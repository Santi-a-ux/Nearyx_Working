export class ProfileImageController {
  constructor(profileImageService) {
    this.profileImageService = profileImageService;
  }

  uploadAvatar = async (req, res) => {
    const avatarUrl = await this.profileImageService.uploadAvatar(req.user.userId, req.file);
    res.status(201).json({ avatar_url: avatarUrl });
  };
}
