import { User } from '../../database/models/index.js';
import { NotFoundError } from '../../common/errors/AppError.js';

export class UsersService {
  static async findById(id: string) {
    const user = await User.findById(id).select('name email phone role avatar isActive createdAt');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  static async updateProfile(id: string, data: { name?: string; phone?: string; avatar?: string }) {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).select('name email phone role avatar isActive createdAt');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }
}
