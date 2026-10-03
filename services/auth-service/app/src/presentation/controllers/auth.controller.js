import { toTokenDto, toTokenPairDto, toUserDto, toVerifyDto } from '../dtos/auth.dto.js';

export class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  register = async (req, res) => {
    res.json(toTokenDto(await this.authService.register(req.body)));
  };

  login = async (req, res) => {
    res.json(toTokenDto(await this.authService.login(req.body)));
  };

  refresh = async (req, res) => {
    res.json(toTokenPairDto(await this.authService.refresh(req.body.refresh_token)));
  };

  logout = async (req, res) => {
    await this.authService.logout(req.user);
    res.json({ message: 'logged out' });
  };

  me = async (req, res) => {
    res.json(toUserDto(req.user));
  };

  verifyToken = async (req, res) => {
    res.json(toVerifyDto(this.authService.verifyToken(req.body.token)));
  };

  wsToken = async (req, res) => {
    res.json({ token: this.authService.getWsToken(req.user) });
  };

  promoteToTutor = async (req, res) => {
    const { accessToken, role } = await this.authService.promoteToTutor(req.user);
    res.json({ access_token: accessToken, role });
  };
}
