import express from "express";
import {
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoardById,
  deleteBoardById,
  addBoardMember,
} from "../controllers/board.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .post(createBoard)
  .get(getAllBoards);

router.route("/:board_id")
  .get(getBoardById)
  .patch(updateBoardById)
  .delete(deleteBoardById);

router.route("/:board_id/members")
  .post(addBoardMember);

export default router;