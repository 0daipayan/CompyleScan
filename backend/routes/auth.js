import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ---------------------------------------------------------
// Generate JWT token
// ---------------------------------------------------------
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fallback_secret',
    {
      expiresIn: '7d',
    }
  );
};

// ---------------------------------------------------------
// REGISTER
// ---------------------------------------------------------
// Creates a new Retailer or Inspector account
// ---------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      officerId,
      jurisdiction,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !officerId
    ) {
      return res.status(400).json({
        error:
          'All required registration fields must be provided',
      });
    }

    // -------------------------------------------------------
    // Validate role
    // -------------------------------------------------------
    const normalizedRole = role.toLowerCase();

    if (!['retailer', 'inspector'].includes(normalizedRole)) {
      return res.status(400).json({
        error:
          'Invalid role. Only Retailer or Inspector can register.',
      });
    }

    // -------------------------------------------------------
    // Check if Retailer/Inspector ID already exists
    // -------------------------------------------------------
    const existingOfficer = await User.findOne({
      officerId: officerId.trim(),
    });

    if (existingOfficer) {
      return res.status(409).json({
        error:
          'This Retailer/Inspector ID is already registered',
      });
    }

    // -------------------------------------------------------
    // Check if email already exists
    // -------------------------------------------------------
    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingEmail) {
      return res.status(409).json({
        error: 'This email is already registered',
      });
    }

    // -------------------------------------------------------
    // Hash password
    // -------------------------------------------------------
    const passwordHash = await bcrypt.hash(
      password,
      10
    );

    // -------------------------------------------------------
    // Create user
    // -------------------------------------------------------
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: normalizedRole,
      officerId: officerId.trim(),
      jurisdiction:
        jurisdiction?.trim() || 'West Bengal',
    });

    // -------------------------------------------------------
    // Registration response
    // -------------------------------------------------------
    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerId: user.officerId,
        jurisdiction: user.jurisdiction,
      },
    });

  } catch (err) {
    console.error(
      'Registration Error:',
      err
    );

    return res.status(500).json({
      error: 'Registration failed',
      details: err.message,
    });
  }
});

// ---------------------------------------------------------
// LOGIN
// ---------------------------------------------------------
// Login using Retailer/Inspector ID + password + role
// ---------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const {
      officerId,
      password,
      role,
    } = req.body;

    // -------------------------------------------------------
    // Validate input
    // -------------------------------------------------------
    if (!officerId || !password) {
      return res.status(400).json({
        error:
          'Retailer/Inspector ID and password are required',
      });
    }

    // -------------------------------------------------------
    // Find user by Retailer/Inspector ID
    // -------------------------------------------------------
    const user = await User.findOne({
      officerId: officerId.trim(),
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid ID or password',
      });
    }

    // -------------------------------------------------------
    // Check selected role
    // -------------------------------------------------------
    if (
      role &&
      user.role !== role.toLowerCase()
    ) {
      return res.status(401).json({
        error:
          'Selected role does not match this account',
      });
    }

    // -------------------------------------------------------
    // Check password
    // -------------------------------------------------------
    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid ID or password',
      });
    }

    // -------------------------------------------------------
    // Generate JWT
    // -------------------------------------------------------
    const token = generateToken(user._id);

    // -------------------------------------------------------
    // Login response
    // -------------------------------------------------------
    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        officerId: user.officerId,
        jurisdiction: user.jurisdiction,
      },
    });

  } catch (err) {
    console.error(
      'Login Error:',
      err
    );

    return res.status(500).json({
      error: 'Login failed',
      details: err.message,
    });
  }
});

// ---------------------------------------------------------
// CURRENT USER
// ---------------------------------------------------------
// Returns the currently authenticated user
// ---------------------------------------------------------
router.get(
  '/me',
  protect,
  async (req, res) => {
    return res.json(req.user);
  }
);

export default router;