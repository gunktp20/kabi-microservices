import express from "express";
import { getUserById, getUserByEmail, getCurrentUser, checkUserExists, checkEmailExists, getUsersByIds, getUsers } from "../controllers/user.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.route("/check-exists")
  .post(checkUserExists);

router.route("/check-email-exists")
  .post(checkEmailExists);

router.use(authenticateUser);

router.route("/")
  .get(getUsers);

router.route("/batch")
  .post(getUsersByIds);

router.route("/me")
  .get(getCurrentUser);

router.route("/:user_id")
  .get(getUserById);

router.route("/by-email/:email")
  .get(getUserByEmail);

export default router;
