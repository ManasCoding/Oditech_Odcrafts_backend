const AuthService = require('../services/auth.service');

class AuthController {
  static async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.json({ status: 'success', data: result });
    } catch (error) {
      next(error);
    }
  }

  static async logout(_req, res) {
    res.json({ status: 'success', message: 'Logged out successfully' });
  }

  static async getMe(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id);
      res.json({ status: 'success', data: { user } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AuthController };
