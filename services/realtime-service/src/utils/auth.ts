import jwt from 'jsonwebtoken';
import { JWT_PUBLIC_KEY } from '../config/application.config';
import { Socket } from 'socket.io';
import fs from 'fs';
import path from 'path';


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

    // Read public key file
    let publicKey: string;
    if (JWT_PUBLIC_KEY) {
      publicKey = JWT_PUBLIC_KEY;
    } else {
      const keyPath = path.join(__dirname, '../../..', 'keys', 'public_key.pem');
      publicKey = fs.readFileSync(keyPath, 'utf8');
    }

    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as any;
    (socket as AuthenticatedSocket).user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    next(new Error('Invalid authentication token'));
  }
};