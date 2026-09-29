
const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./src/models/User');

const MONGO_URI = process.env.MONGODB_URI;

const test = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const admins = await User.find({ role: 'ADMIN' }).select('-passwordHash').sort({ createdAt: -1 }).lean();
    console.log('Admins count:', admins.length);
    console.log(admins);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
test();

