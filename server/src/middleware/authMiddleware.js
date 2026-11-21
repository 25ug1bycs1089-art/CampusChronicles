import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'development_jwt_secret_placeholder';
};

/**
 * Protect routes: verifies JWT from HTTP-only cookie or Authorization header
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check HTTP-only cookie first (preferred)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fallback to Bearer token in Authorization header
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Please log in to access this resource.',
    });
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, getJwtSecret());

    // Retrieve user profile (excluding password)
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Token is invalid or expired.',
    });
  }
};

/**
 * Optional protection: attaches user to req.user if a valid token is present,
 * but does NOT reject unauthenticated requests.
 */
export const optionalProtect = async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch {
      // Ignore token verification errors for optional auth
    }
  }

  next();
};

/**
 * Authorize roles: verifies if authenticated user possesses required role(s)
 */
export const authorize = (...roles) => {
  const normalizedRoles = roles.map((r) => r.toLowerCase().trim());
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to authorization check.',
      });
    }

    const userRole = (req.user.role || '').toLowerCase().trim();
    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' does not have permission to access this resource.`,
      });
    }

    next();
  };
};
