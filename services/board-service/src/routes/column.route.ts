import express from "express";
import {
  createColumn,
  updateColumnName,
  deleteColumn,
} from "../controllers/column.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .post(createColumn)
  .patch(updateColumnName);

router.route("/:column_id")
  .delete(deleteColumn);

export default router;