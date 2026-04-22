import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const resolvedJwtSecret = process.env.JWT_SECRET && !process.env.JWT_SECRET.includes('your_jwt_secret_here')
  ? process.env.JWT_SECRET
  : 'dev-jwt-secret-change-me';

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth failed: No Bearer token in header');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, resolvedJwtSecret);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      console.log('Auth failed: User not found for token ID:', decoded.id);
      return res.status(401).json({ message: 'User not found for this token' });
    }
    next();
  } catch (error) {
    console.log('Auth failed: Token verification error:', error.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;
