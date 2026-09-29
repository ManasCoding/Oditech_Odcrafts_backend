const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { env } = require('./src/config/env');
const { User } = require('./src/models');

async function fixUser() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to DB');

    // Find any user
    const user = await User.findOne({});
    if (!user) {
      console.log('No user found in database. Please register a new user.');
    } else {
      console.log(`Found user: ${user.email}`);
      const BCRYPT_ROUNDS = parseInt(env.BCRYPT_ROUNDS || 10, 10);
      const newHash = await bcrypt.hash('12345678', BCRYPT_ROUNDS);
      
      user.passwordHash = newHash;
      user.role = 'ADMIN';
      await user.save();
      console.log(`Successfully reset password for ${user.email} to: 12345678 and set role to ADMIN`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixUser();
