import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const resolvedJwtSecret = process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('your_jwt_secret_here')
  ? process.env.JWT_SECRET
  : 'dev-jwt-secret-change-me';

const generateToken = (id) => jwt.sign({ id }, resolvedJwtSecret, { expiresIn: '7d' });

const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

export const register = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({ user: serializeUser(user), token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const email = req.body?.email?.trim()?.toLowerCase();
    const password = req.body?.password;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({ user: serializeUser(user), token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({ user: serializeUser(req.user) });
};
