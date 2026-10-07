import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { userRepo } from '../repositories';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required.' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  const user = await userRepo.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists.' });
  }

  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  next();
};
