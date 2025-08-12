import express from "express";
import {
  createBoardInvitation,
  createBulkBoardInvitations,
  acceptInvitation,
  declineInvitation,
  readInvitations,
} from "../controllers/invitation.controller";
import { authenticateUser } from "../middlewares/auth";

const router = express.Router();

router.use(authenticateUser);

router.route("/:board_id")
  .post(createBoardInvitation);

router.route("/:board_id/bulk")
  .post(createBulkBoardInvitations);

router.route("/:invitation_id/accept")
  .post(acceptInvitation);

router.route("/:invitation_id/decline")
  .post(declineInvitation);

router.route("/read")
  .patch(readInvitations);

export default router;