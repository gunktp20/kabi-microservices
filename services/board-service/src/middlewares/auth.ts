import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET_ACCESS } from "../config/application.config";
import { UnAuthenticatedError } from "../errors";

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
    const payload = jwt.verify(token, JWT_SECRET_ACCESS) as JwtPayload & AuthenticatedUser;
    req.user = { userId: payload.userId, email: payload.email };
    next();
  } catch (error) {

    console.log("ERR : " , error)
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};