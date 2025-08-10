import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Board from "../models/Board";
import Column from "../models/Column";
import BoardMembers from "../models/BoardMembers";
import { BadRequestError, UnAuthenticatedError, NotFoundError } from "../errors";
import "express-async-errors";
import { Op } from "sequelize";

const createBoard = async (req: Request, res: Response) => {
  const { board_name, key, description } = req.body;
  if (!board_name || !key || typeof req.user?.userId === "undefined") {
    throw new BadRequestError("Please provide all value");
  }

  try {
    const newBoard = await Board.create({
      board_name,
      key,
      description: description || null,
      owner_id: req.user?.userId,
    });

    await BoardMembers.create({
      user_id: req.user?.userId,
      board_id: newBoard.id,
    });

    const columns = [
      {
        column_name: "TO DO",
        board_id: newBoard.id,
        sequence: 1,
      },
      {
        column_name: "IN PROGRESS",
        board_id: newBoard.id,
        sequence: 2,
      },
      {
        column_name: "DONE",
        board_id: newBoard.id,
        sequence: 3,
      },
    ];
    await Column.bulkCreate(columns);
    
    return res.status(StatusCodes.CREATED).json({
      msg: "Created your board successfully",
      board: newBoard
    });
  } catch (err) {

    console.log("ERR",err)
    throw err;
  }
};

const getAllBoards = async (req: Request, res: Response) => {
  const { query } = req.query;
  const numOfPage: number = parseInt(req.query.numOfPage as string) || 1;
  const limit: number = parseInt(req.query.limit as string) || 5;

  const offset = (numOfPage - 1) * limit;

  try {
    const { count, rows } = await BoardMembers.findAndCountAll({
      where: { user_id: req.user?.userId },
      attributes: ["id"],
      include: [
        {
          model: Board,
          attributes: [["id", "board_id"], "board_name", "description", "key", "owner_id"],
          where: {
            board_name: {
              [Op.like]: `%${query ? query : ""}%`,
            },
          },
        },
      ],
      limit,
      offset,
    });
    const totalPages = Math.ceil(count / limit);

    return res
      .status(StatusCodes.OK)
      .json({ boards: rows, numOfPage, totalPages });
  } catch (err) {
    throw err;
  }
};

const getBoardById = async (req: Request, res: Response) => {
  const { board_id } = req.params;
  const isMemberInBoard = await BoardMembers.findOne({
    where: { user_id: req.user?.userId, board_id },
  });

  if (!isMemberInBoard) {
    throw new UnAuthenticatedError("Your are not a member in the board");
  }

  try {
    const board = await Board.findOne({
      where: { id: board_id },
      include: [
        {
          model: Column,
          attributes: ["id", "column_name", "sequence"],
          separate: true,
          order: [["sequence", "ASC"]],
        },
      ],
    });

    if (!board) {
      throw new NotFoundError("Board not found");
    }

    const members = await BoardMembers.findAll({
      where: { board_id },
      attributes: ["user_id"],
    });

    return res.status(StatusCodes.OK).json({ board, members });
  } catch (err) {
    throw err;
  }
};

const updateBoardById = async (req: Request, res: Response) => {
  const { board_name, key, description } = req.body;
  const isBoardOwner = await Board.findOne({
    where: { id: req.params.board_id, owner_id: req.user?.userId },
  });

  if (!isBoardOwner) {
    throw new UnAuthenticatedError("Your are not a owner of the board");
  }

  await Board.update(
    {
      board_name,
      key,
      description,
    },
    { where: { id: req.params.board_id } }
  );
  res.status(StatusCodes.OK).json({ msg: "Updated your board" });
};

const deleteBoardById = async (req: Request, res: Response) => {
  const { board_id } = req.params;

  const isBoardOwner = await Board.findOne({
    where: { id: req.params.board_id, owner_id: req.user?.userId },
  });

  if (!isBoardOwner) {
    throw new UnAuthenticatedError("Your are not a owner of the board");
  }

  await Board.destroy({
    where: { id: board_id },
  });
  res.status(StatusCodes.OK).json({ msg: "Deleted your board" });
};

const addBoardMember = async (req: Request, res: Response) => {
  const { user_id } = req.body;
  const { board_id } = req.params;

  if (!user_id || !board_id) {
    throw new BadRequestError("Please provide user_id and board_id");
  }

  const board = await Board.findOne({
    where: { id: board_id }
  });

  if (!board) {
    throw new NotFoundError("Board not found");
  }

  const existingMember = await BoardMembers.findOne({
    where: { user_id, board_id }
  });

  if (existingMember) {
    return res.status(StatusCodes.OK).json({ msg: "User is already a member of this board" });
  }

  await BoardMembers.create({ user_id, board_id });

  res.status(StatusCodes.OK).json({ msg: "User added to board successfully" });
};

const getBoardMembers = async (req: Request, res: Response) => {
  const { board_id } = req.params;

  const isMemberInBoard = await BoardMembers.findOne({
    where: { user_id: req.user?.userId, board_id },
  });

  if (!isMemberInBoard) {
    throw new UnAuthenticatedError("You are not a member in the board");
  }

  const members = await BoardMembers.findAll({
    where: { board_id },
  });

  res.status(StatusCodes.OK).json({ members });
};

const checkBoardMembership = async (req: Request, res: Response) => {
  const { board_id, user_id } = req.params;

  const member = await BoardMembers.findOne({
    where: { board_id, user_id }
  });

  if (!member) {
    return res.status(StatusCodes.NOT_FOUND).json({ 
      message: "User is not a member of this board" 
    });
  }

  res.status(StatusCodes.OK).json({ member });
};

export {
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoardById,
  deleteBoardById,
  addBoardMember,
  getBoardMembers,
  checkBoardMembership,
};