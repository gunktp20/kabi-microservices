import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import schedule from "node-schedule";
import {
  BadRequestError,
  UnAuthenticatedError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  InternalServerError,
} from "../errors/index";
import jwt, {
  JsonWebTokenError,
  JwtPayload,
  TokenExpiredError,
} from "jsonwebtoken";
import {
  SECRET_VERIFY_EMAIL,
  CLIENT_URL,
  JWT_SECRET_ACCESS,
  JWT_SECRET_REFRESH,
  EXPIRES_IN_ACCESS_TOKEN,
  EXPIRES_IN_REFRESH_TOKEN,
  AUTH_EMAIL,
} from "../config/application.config";
import { FORM_VERIFY_EMAIL } from "../utils/emailVerification";
import transporter from "../utils/transporter";
import User from "../models/User";
import RefreshToken from "../models/RefreshToken";
import "express-async-errors";
import bcrypt from "bcrypt";

interface IJwtPayload extends JwtPayload {
  email: string;
}

// Helper functions for token management
const generateTokens = async (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { userId, email },
    JWT_SECRET_ACCESS,
    { expiresIn: EXPIRES_IN_ACCESS_TOKEN }
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' },
    JWT_SECRET_REFRESH,
    { expiresIn: EXPIRES_IN_REFRESH_TOKEN }
  );

  // Calculate expiry date
  const expiresAt = new Date();
  const refreshTokenExpiry = EXPIRES_IN_REFRESH_TOKEN;
  if (refreshTokenExpiry.endsWith('d')) {
    const days = parseInt(refreshTokenExpiry.slice(0, -1));
    expiresAt.setDate(expiresAt.getDate() + days);
  } else if (refreshTokenExpiry.endsWith('h')) {
    const hours = parseInt(refreshTokenExpiry.slice(0, -1));
    expiresAt.setHours(expiresAt.getHours() + hours);
  }

  // Store refresh token in database
  await RefreshToken.create({
    user_id: userId,
    token: refreshToken,
    expires_at: expiresAt
  });

  return { accessToken, refreshToken };
};

const revokeUserTokens = async (userId: string) => {
  await RefreshToken.update(
    { revoked: true, revoked_at: new Date() },
    { where: { user_id: userId, revoked: false } }
  );
};

const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!password || !email) {
    throw new BadRequestError("Please provide all value");
  }

  const user = await User.findOne({ where: { email } });

  if (user?.verified === true) {
    throw new ConflictError("E-mail was taken");
  }

  const salt = await bcrypt.genSalt(10);
  const encodedPassword = await bcrypt.hash(password, salt);

  const date = new Date();
  const expiredIn = date.setMinutes(date.getMinutes() + 15);

  if (user?.verified === false) {
    const token = await jwt.sign({ email }, SECRET_VERIFY_EMAIL, {
      expiresIn: "15m",
    });

    try {
      await transporter.sendMail({
        from: AUTH_EMAIL,
        to: email,
        html: FORM_VERIFY_EMAIL(token, CLIENT_URL),
      });
    } catch (err) {
      console.log(err)
      throw err;
    }

    const countDeleteUser = schedule.scheduleJob(expiredIn, async () => {
      const user = await User.findOne({ where: { email } });
      if (user?.verified === false) {
        await User.destroy({ where: { email } });
      }
      countDeleteUser.cancel();
    });

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Resend your verification in your e-mail" });
  }

  const token = await jwt.sign({ email }, SECRET_VERIFY_EMAIL, {
    expiresIn: "15m",
  });

  await User.create({
    email,
    password: encodedPassword,
    displayName: email.split("@")[0],
  });

  await transporter.sendMail({
    from: AUTH_EMAIL,
    to: email,
    html: FORM_VERIFY_EMAIL(token, CLIENT_URL),
  });

  const countDeleteUser = schedule.scheduleJob(expiredIn, async () => {
    const user = await User.findOne({ where: { email } });
    if (user?.verified === false) {
      await User.destroy({ where: { email } });
    }
    countDeleteUser.cancel();
  });

  return res.status(StatusCodes.OK).json({
    msg: "Created your account , Please verify your email in 15 minutes",
  });
};

const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new UnAuthenticatedError("E-mail or password is incorrect");
  }

  const isPasswordCorrect = await bcrypt.compare(
    password,
    user?.password || ""
  );

  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError("E-mail or password is incorrect");
  }

  if (!user.verified) {
    throw new UnAuthenticatedError("Please verify your e-mail before");
  }

  // Revoke existing refresh tokens for this user
  await revokeUserTokens(user.id);

  // Generate new tokens
  const { accessToken, refreshToken } = await generateTokens(user.id, email);

  res.status(StatusCodes.OK).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        email,
        displayName: user?.displayName,
      },
    },
  });
};

const verifyEmailWithToken = async (req: Request, res: Response) => {
  const token = req.body.token;
  if (!token) {
    throw new BadRequestError("Please provide a token");
  }

  try {
    const { email } = (await jwt.verify(
      token,
      SECRET_VERIFY_EMAIL
    )) as IJwtPayload;

    const user = await User.findOne({ where: { email } });
    if (user?.verified === true) {
      throw new BadRequestError("The account was verified");
    }

    await User.update(
      { verified: true },
      {
        where: { email },
      }
    );
    return res.status(StatusCodes.OK).json({
      msg: `your account was verified`,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new ForbiddenError("Token expired");
    }
    if (err instanceof JsonWebTokenError) {
      throw new UnAuthenticatedError("Token is invalid");
    }
    throw err;
  }
};

const verifyAccessToken = async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
  const accessToken = authHeader.split(" ")[1];
  try {
    const decoded = (await jwt.verify(accessToken, JWT_SECRET_ACCESS)) as any;
    return res.status(StatusCodes.OK).json({
      success: true,
      data: {
        userId: decoded.userId,
        email: decoded.email,
      },
    });
  } catch (err) {
    throw new UnAuthenticatedError("Authentication Invalid");
  }
};

const getUserProfile = async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findByPk(userId, {
    attributes: ["id", "email", "displayName", "verified"],
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: user,
  });
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new BadRequestError("Refresh token is required");
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, JWT_SECRET_REFRESH) as IJwtPayload & { type: string };
    
    if (decoded.type !== 'refresh') {
      throw new UnAuthenticatedError("Invalid token type");
    }

    // Check if token exists in database and is not revoked
    const storedToken = await RefreshToken.findOne({
      where: { 
        token,
        user_id: decoded.userId,
        revoked: false
      }
    });

    if (!storedToken) {
      throw new UnAuthenticatedError("Refresh token is invalid or expired");
    }

    // Check if token is expired
    if (storedToken.expires_at < new Date()) {
      throw new UnAuthenticatedError("Refresh token has expired");
    }

    // Get user
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new UnAuthenticatedError("User not found");
    }

    // Revoke current refresh token
    await RefreshToken.update(
      { revoked: true, revoked_at: new Date() },
      { where: { id: storedToken.id } }
    );

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user.id, user.email);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      },
    });

  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new UnAuthenticatedError("Refresh token has expired");
    }
    if (error instanceof JsonWebTokenError) {
      throw new UnAuthenticatedError("Invalid refresh token");
    }
    throw error;
  }
};

const logout = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const userId = req.user?.userId;

  if (token) {
    // Revoke specific refresh token
    await RefreshToken.update(
      { revoked: true, revoked_at: new Date() },
      { where: { token, user_id: userId } }
    );
  }

  if (userId) {
    // Revoke all refresh tokens for user
    await revokeUserTokens(userId);
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Logged out successfully"
  });
};

export {
  register,
  login,
  verifyEmailWithToken,
  verifyAccessToken,
  getUserProfile,
  refreshToken,
  logout,
};
