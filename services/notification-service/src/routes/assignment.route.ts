import express from "express";
import { readAssignments } from "../controllers/assignment.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.route("/read").put(authenticateUser, readAssignments);

export default router;