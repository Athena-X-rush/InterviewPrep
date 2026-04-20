import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const resolvedJwtSecret = process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('your_jwt_secret_here')
  ? process.env.JWT_SECRET
  : 'dev-jwt-secret-change-me';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, resolvedJwtSecret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'User not found for this token' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
