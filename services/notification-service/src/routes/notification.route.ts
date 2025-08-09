import express from "express";
import { getAllNotifications } from "../controllers/notification.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/")
  .get(getAllNotifications);

export default router;