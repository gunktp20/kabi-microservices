import express from "express";
import {
  createBoardInvitation,
  acceptInvitation,
  declineInvitation,
  readInvitations,
} from "../controllers/invitation.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/:board_id")
  .post(createBoardInvitation);

router.route("/accept")
  .post(acceptInvitation);

router.route("/decline")
  .post(declineInvitation);

router.route("/read")
  .patch(readInvitations);

export default router;