import express from "express";
import { 
  readAssignments,
  createAssignment,
  deleteAssignmentsByTaskId,
  getAssignmentByTaskAndUser,
  deleteAssignment
} from "../controllers/assignment.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .post(createAssignment);

router.route("/read")
  .patch(readAssignments);

router.route("/task/:task_id")
  .delete(deleteAssignmentsByTaskId);

router.route("/task/:task_id/user/:user_id")
  .get(getAssignmentByTaskAndUser);

router.route("/:assignment_id")
  .delete(deleteAssignment);

export default router;