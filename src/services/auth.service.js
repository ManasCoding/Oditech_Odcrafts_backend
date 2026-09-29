const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const slugify = require('slugify');
const { User, UserRole } = require('../models');
const { SellerProfile } = require('../models');
const { Wishlist } = require('../models');
const { Cart } = require('../models');
const { env } = require('../config/env');
const { UnauthorizedError, ValidationError, NotFoundError } = require('../utils/AppError');

const BCRYPT_ROUNDS = parseInt(env.BCRYPT_ROUNDS, 10);

function generateTokens(userId, role) {
  const accessToken = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION,
  });
  const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION,
  });
  return { accessToken, refreshToken };
}

async function register(data) {
  const existing = await User.findOne({
    $or: [{ email: data.email.toLowerCase() }, { phone: data.phone }],
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
    role: data.role || UserRole.CUSTOMER,
  });

  if (user.role === UserRole.SELLER) {
    const baseSlug = slugify(data.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    while (await SellerProfile.exists({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }
    await SellerProfile.create({ userId: user._id, slug, state: 'Odisha' });
  } else if (user.role === UserRole.CUSTOMER) {
    await Promise.all([
      Cart.create({ userId: user._id, items: [] }),
      Wishlist.create({ userId: user._id, items: [] }),
    ]);
  }

  const tokens = generateTokens(user._id.toString(), user.role);
  return {
    ...tokens,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  };
}

async function login(data) {
  const user = await User.findOne({ email: data.email.toLowerCase() }).select('+passwordHash');
  if (!user) throw new UnauthorizedError('Invalid email or password');
  if (!user.isActive) throw new UnauthorizedError('Your account has been suspended');
  if (user.deletedAt) throw new UnauthorizedError('Account not found');

  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError('Invalid email or password');

  User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).exec();

  const tokens = generateTokens(user._id.toString(), user.role);
  return {
    ...tokens,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  };
}

async function refreshToken(token) {
  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('isActive role deletedAt');
  if (!user || !user.isActive || user.deletedAt) {
    throw new UnauthorizedError('Account not found or suspended');
  }

  return generateTokens(user._id.toString(), user.role);
}

async function getMe(userId) {
  const user = await User.findById(userId).select('-passwordHash');
  if (!user || !user.isActive) throw new NotFoundError('User not found');

  let profileData = {};
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

module.exports = { register, login, refreshToken, getMe, generateTokens };
