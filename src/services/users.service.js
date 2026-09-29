const { User } = require('../models');
const { NotFoundError } = require('../utils/AppError');

async function findById(id) {
  const user = await User.findById(id).select('name email phone role avatar isActive createdAt');
  if (!user) throw new NotFoundError('User not found');
  return user;
}

async function updateProfile(id, data) {
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  ).select('name email phone role avatar isActive createdAt');
  if (!user) throw new NotFoundError('User not found');
  return user;
}

module.exports = { findById, updateProfile };
