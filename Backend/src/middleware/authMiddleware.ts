import { Request, Response, NextFunction } from 'express';
import { jwtVerify, JWTPayload } from 'jose';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const { payload } = await jwtVerify(token, secret) as { payload: JWTPayload & { userId: string; email: string } };
    
    req.user = {
      userId: payload.userId as string,
      email: payload.email as string
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}