import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to sign JWT Tokens
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d'
  });
};

// 1. Register User (Inspector or Officer)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, officerId, jurisdiction } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'inspector',
      officerId: officerId || `LM-${Math.floor(1000 + Math.random() * 9000)}`,
      jurisdiction: jurisdiction || 'West Bengal'
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerId: user.officerId
      }
    });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// 2. Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerId: user.officerId
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// 3. Get Current User Profile
router.get('/me', protect, async (req, res) => {
  return res.json(req.user);
});

export default router;