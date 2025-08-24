import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import User from "../models/User";
import { NotFoundError, BadRequestError } from "../errors";
import "express-async-errors";
import { Op } from "sequelize";

const getUserById = async (req: Request, res: Response) => {
  const { user_id } = req.params;

  const user = await User.findOne({
    where: { id: user_id },
    attributes: ["id", "email", "displayName", "verified"],
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
    attributes: ["id", "email", "displayName", "verified"],
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  res.status(StatusCodes.OK).json({ user });
};

const getCurrentUser = async (req: Request, res: Response) => {
  const user = await User.findOne({
    where: { id: req.user?.userId },
    attributes: ["id", "email", "displayName", "verified"],
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
      message: "user_id is required",
    });
  }

  const user = await User.findOne({
    where: { id: user_id },
    attributes: ["id", "displayName"],
  });

  res.status(StatusCodes.OK).json({
    exists: !!user,
    user_id: user_id,
    display_name: user?.displayName,
  });
};

const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      exists: false,
      message: "email is required",
    });
  }

  const user = await User.findOne({
    where: { email: email },
    attributes: ["email", "displayName"],
  });

  res.status(StatusCodes.OK).json({
    exists: !!user,
    email: email,
    display_name: user?.displayName,
  });
};

const getUsersByIds = async (req: Request, res: Response) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new BadRequestError(
      "userIds array is required and must not be empty"
    );
  }

  const users = await User.findAll({
    where: { id: userIds },
    attributes: ["id", "email", "displayName", "verified"],
  });

  res.status(StatusCodes.OK).json({
    success: true,
    data: users,
  });
};

const getUsers = async (req: Request, res: Response) => {
  const { search } = req.query;
  const { page = 1, limit = 10, sortBy = "id", sortOrder = "ASC" } = req.query;

  const pageNumber = Math.max(1, parseInt(page as string) || 1);
  const limitNumber = Math.min(
    100,
    Math.max(1, parseInt(limit as string) || 10)
  ); 
  const offset = (pageNumber - 1) * limitNumber;

  const whereClause: any = {};

   if (search && typeof search === 'string' && search.trim()) {
    whereClause[Op.or] = [
      { email: { [Op.iLike]: `%${search.trim()}%` } },
      { displayName: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }

  // if (search && search.trim()) {
  //   whereClause[Op.or] = [
  //     { email: { [Op.iLike]: `%${search.trim()}%` } },
  //     { displayName: { [Op.iLike]: `%${search.trim()}%` } },
  //   ];
  // }

  // const validSortFields = [
  //   "id",
  //   "email",
  //   "displayName",
  //   "createdAt",
  //   "updatedAt",
  // ];dd
  // const validSortOrders = ["ASC", "DESC"];

  // const orderBy = validSortFields.includes(sortBy as string)
  //   ? (sortBy as string)
  //   : "id";
  // const orderDirection = validSortOrders.includes(
  //   (sortOrder as string).toUpperCase()
  // )
  //   ? (sortOrder as string).toUpperCase()
  //   : "ASC";

  try {
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: ["id", "email", "displayName", "verified"],
      // attributes: ["id", "email", "displayName", "verified", "createdAt"],
      limit: limitNumber,
      offset: offset,
      // order: [[orderBy, orderDirection]],
      distinct: true,
    });

    const totalItems = count;
    const totalPages = Math.ceil(totalItems / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(StatusCodes.OK).json({
      success: true,
      data: users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems,
        itemsPerPage: limitNumber,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? pageNumber + 1 : null,
        prevPage: hasPrevPage ? pageNumber - 1 : null,
      },
      filters: {
        search: search || null,
        // sortBy: orderBy,
        // sortOrder: orderDirection,
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Error fetching users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export {
  getUserById,
  getUserByEmail,
  getCurrentUser,
  checkUserExists,
  checkEmailExists,
  getUsersByIds,
  getUsers
};
