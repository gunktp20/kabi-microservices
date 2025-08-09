import jwt from 'jsonwebtoken';
import { JWT_SECRET_ACCESS } from '../config/application.config';
import { Socket } from 'socket.io';

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

export interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedUser;
}

export const authenticateSocket = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    const decoded = jwt.verify(token, JWT_SECRET_ACCESS) as any;
    (socket as AuthenticatedSocket).user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    next(new Error('Invalid authentication token'));
  }
};