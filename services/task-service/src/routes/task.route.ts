import express from "express";
import {
  createTask,
  getTasksByBoardId,
  deleteTaskById,
  updateTasksOrder,
  updateTaskDescription,
  assignToMember,
  getTaskById
} from "../controllers/task.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .post(createTask);

router.route("/board/:board_id")
  .get(getTasksByBoardId);

router.route("/board/:board_id/order")
  .patch(updateTasksOrder);

router.route("/:task_id")
  .get(getTaskById)
  .patch(updateTaskDescription)
  .delete(deleteTaskById);

router.route("/:task_id/assign")
  .post(assignToMember);

export default router;