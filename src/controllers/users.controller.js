const UsersService = require('../services/users.service');

class UsersController {
  static async getMe(req, res, next) {
    try {
      const user = await UsersService.findById(req.user.id);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req, res, next) {
    try {
      const user = await UsersService.updateProfile(req.user.id, req.body);
      res.json({ status: 'success', data: user });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { UsersController };
