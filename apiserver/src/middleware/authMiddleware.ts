import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        verificationStatus: string;
      };
    }
  }
}

// This is a placeholder for actual authentication logic
// In a real application, you would validate JWT tokens or other auth mechanisms
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    res.status(401).json({ error: 'Authorization header is required' });
    return;
  }
  
  // Check if token format is correct
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({ error: 'Token format is invalid. Use "Bearer <token>"' });
    return;
  }
  
  const token = parts[1];
  
  try {
    // Verify and decode the token
    const decoded = jwt.verify(token, config.jwtSecret || 'your-secret-key') as {
      id: string;
      role: string;
      verificationStatus: string;
    };
    console.log("decoded",decoded);
    
    // Set user information in request
    req.user = {
      userId: decoded.id,
      role: decoded.role,
      verificationStatus: decoded.verificationStatus
    };
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
}; 