import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['inspector', 'officer', 'admin'], 
    default: 'inspector' 
  },
  officerId: { type: String, required: true }, // e.g. "LM-2026-0417"
  jurisdiction: { type: String, default: 'West Bengal' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);