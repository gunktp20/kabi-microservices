import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PUBLIC_KEY } from "../config/application.config";
import { UnAuthenticatedError } from "../errors";
import axios from "axios";

interface AuthenticatedUser {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
 
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as JwtPayload & AuthenticatedUser;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (error) {
    // ถ้า access token หมดอายุ และมี refresh token ใน headers
    const refreshToken = req.headers['x-refresh-token'] as string;
    
    if (refreshToken) {
      try {
        // เรียก user-service เพื่อ refresh token
        const response = await axios.post('http://localhost:3001/api/v1/auth/refresh', {
          refreshToken
        });
        
        if (response.data.success) {
          // ใช้ access token ใหม่
          const newPayload = jwt.verify(
            response.data.data.accessToken, 
            JWT_PUBLIC_KEY,
            { algorithms: ['RS256'] }
          ) as JwtPayload & AuthenticatedUser;
          
          req.user = { userId: newPayload.userId, email: newPayload.email };
          
          // ส่ง token ใหม่กลับใน response headers
          res.setHeader('x-new-access-token', response.data.data.accessToken);
          res.setHeader('x-new-refresh-token', response.data.data.refreshToken);
          
          return next();
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }

    console.log("Authentication error:", error);
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};