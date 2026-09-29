import { Category } from '../../database/models/index.js';
import { NotFoundError } from '../../common/errors/AppError.js';

export class CategoriesService {
  static async getAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return Category.find(filter)
      .sort({ sortOrder: 1, name: 1 })
      .lean();
  }

  static async getBySlug(slug: string) {
    const category = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async create(data: {
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string;
    sortOrder?: number;
  }) {
    return Category.create(data);
  }

  static async update(id: string, data: Partial<{
    name: string;
    description: string;
    image: string;
    isActive: boolean;
    sortOrder: number;
  }>) {
    const category = await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }

  static async delete(id: string) {
    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) throw new NotFoundError('Category not found');
    return category;
  }
}
