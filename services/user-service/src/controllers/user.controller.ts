import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import { NotFoundError } from "../errors";
import "express-async-errors";

const getUserById = async (req: Request, res: Response) => {
  const { user_id } = req.params;
  
  const user = await User.findOne({
    where: { id: user_id },
    attributes: ["id", "email", "displayName", "verified"]
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({ user });
};

const getUserByEmail = async (req: Request, res: Response) => {
  const { email } = req.params;
  
  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "displayName", "verified"]
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({ user });
};

const getCurrentUser = async (req: Request, res: Response) => {
  const user = await User.findOne({
    where: { id: req.user?.userId },
    attributes: ["id", "email", "displayName", "verified"]
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({ user });
};

export { getUserById, getUserByEmail, getCurrentUser };