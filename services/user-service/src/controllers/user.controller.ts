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

const checkUserExists = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  
  if (!user_id) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      exists: false, 
      message: "user_id is required" 
    });
  }

  const user = await User.findOne({
    where: { id: user_id },
    attributes: ["id","displayName"]
  });

  res.status(StatusCodes.OK).json({ 
    exists: !!user,
    user_id: user_id,
    display_name:user?.displayName
  });
};

const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({ 
      exists: false, 
      message: "email is required" 
    });
  }

 const user = await User.findOne({
    where: { email: email },
    attributes: ["email","displayName"]
  });

  res.status(StatusCodes.OK).json({ 
    exists: !!user,
    email: email,
    display_name:user?.displayName
  });
};

export { getUserById, getUserByEmail, getCurrentUser, checkUserExists, checkEmailExists };