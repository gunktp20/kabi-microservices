import express from "express";
import { readAssignments, getAssignments } from "../controllers/assignment.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .get(getAssignments)
  .patch(readAssignments);

export default router;