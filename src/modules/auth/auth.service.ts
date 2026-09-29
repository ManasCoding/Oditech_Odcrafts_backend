import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import slugify from 'slugify';
import { User, UserRole, SellerProfile, Wishlist, Cart } from '../../database/models/index.js';
import { env } from '../../config/env.js';
import { UnauthorizedError, ValidationError, NotFoundError } from '../../common/errors/AppError.js';
import type { RegisterInput, LoginInput } from './auth.dto.js';

const BCRYPT_ROUNDS = parseInt(env.BCRYPT_ROUNDS, 10);

export class AuthService {
  // ─── Register ─────────────────────────────────────────────────────────────

  static async register(data: RegisterInput) {
    // Check for existing user
    const existing = await User.findOne({
      $or: [
        { email: data.email.toLowerCase() },
        { phone: data.phone },
      ],
    }).select('email phone');

    if (existing) {
      if (existing.email === data.email.toLowerCase()) {
        throw new ValidationError('An account with this email already exists');
      }
      throw new ValidationError('An account with this phone number already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      passwordHash,
      role: data.role ?? UserRole.CUSTOMER,
    });

    // Create role-specific profile
    if (user.role === UserRole.SELLER) {
      const baseSlug = slugify(data.name, { lower: true, strict: true });
      let slug = baseSlug;
      let counter = 1;
      while (await SellerProfile.exists({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }
      await SellerProfile.create({
        userId: user._id,
        slug,
        state: 'Odisha',
      });
    } else if (user.role === UserRole.CUSTOMER) {
      // Create empty cart and wishlist eagerly
      await Promise.all([
        Cart.create({ userId: user._id, items: [] }),
        Wishlist.create({ userId: user._id, items: [] }),
      ]);
    }

    const tokens = this.generateTokens(user._id.toString(), user.role);
    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  static async login(data: LoginInput) {
    const user = await User.findOne({ email: data.email.toLowerCase() })
      .select('+passwordHash');

    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!user.isActive) throw new UnauthorizedError('Your account has been suspended');
    if (user.deletedAt) throw new UnauthorizedError('Account not found');

    const isValid = await bcrypt.compare(data.password, user.passwordHash!);
    if (!isValid) throw new UnauthorizedError('Invalid email or password');

    // Update last login (non-blocking)
    User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).exec();

    const tokens = this.generateTokens(user._id.toString(), user.role);
    return {
      ...tokens,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // ─── Refresh Token ─────────────────────────────────────────────────────────

  static async refreshToken(token: string) {
    let decoded: { userId: string; role: UserRole };
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string; role: UserRole };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.userId).select('isActive role deletedAt');
    if (!user || !user.isActive || user.deletedAt) {
      throw new UnauthorizedError('Account not found or suspended');
    }

    return this.generateTokens(user._id.toString(), user.role);
  }

  // ─── Get Me ───────────────────────────────────────────────────────────────

  static async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user || !user.isActive) throw new NotFoundError('User not found');

    let profileData: Record<string, unknown> = {};
    if (user.role === UserRole.SELLER) {
      const profile = await SellerProfile.findOne({ userId: user._id });
      if (profile) {
        profileData = {
          sellerStatus: profile.status,
          sellerSlug: profile.slug,
          craftType: profile.craftType,
        };
      }
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      createdAt: user.createdAt,
      ...profileData,
    };
  }

  // ─── Token Generator ──────────────────────────────────────────────────────

  static generateTokens(userId: string, role: UserRole) {
    const accessOptions: any = { expiresIn: env.JWT_ACCESS_EXPIRATION };
    const refreshOptions: any = { expiresIn: env.JWT_REFRESH_EXPIRATION };

    const accessToken = jwt.sign(
      { userId, role },
      env.JWT_ACCESS_SECRET,
      accessOptions
    );
    const refreshToken = jwt.sign(
      { userId, role },
      env.JWT_REFRESH_SECRET,
      refreshOptions
    );
    return { accessToken, refreshToken };
  }
}
