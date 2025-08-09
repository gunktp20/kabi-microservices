import express from "express";
import { getUserById, getUserByEmail, getCurrentUser } from "../controllers/user.controller";
import auth from "../middlewares/auth";

const router = express.Router();

router.use(auth);

router.route("/me")
  .get(getCurrentUser);

router.route("/:user_id")
  .get(getUserById);

router.route("/by-email/:email")
  .get(getUserByEmail);

export default router;