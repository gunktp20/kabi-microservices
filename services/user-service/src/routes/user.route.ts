import express from "express";
import { getUserById, getUserByEmail, getCurrentUser } from "../controllers/user.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/me")
  .get(getCurrentUser);

router.route("/:user_id")
  .get(getUserById);

router.route("/by-email/:email")
  .get(getUserByEmail);

export default router;
