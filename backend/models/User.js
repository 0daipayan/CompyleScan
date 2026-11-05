import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,

      // Retailer and Inspector are the application roles.
      // Admin is kept for administrative accounts.
      enum: ['retailer', 'inspector', 'admin'],

      default: 'retailer',
    },

    officerId: {
      type: String,
      required: true,
    },

    jurisdiction: {
      type: String,
      default: 'West Bengal',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);