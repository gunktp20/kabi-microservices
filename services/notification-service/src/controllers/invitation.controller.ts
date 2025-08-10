import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors";
import Invitation from "../models/Invitation";
import "express-async-errors";
import axios from "axios";
import {
  REALTIME_SERVICE_URL,
  USER_SERVICE_URL,
  BOARD_SERVICE_URL,
} from "../config/application.config";

const createBoardInvitation = async (req: Request, res: Response) => {
  const { recipient_id } = req.body;
  const { board_id } = req.params;
  if (!board_id || !recipient_id || typeof req.user?.userId === "undefined") {
    throw new BadRequestError("Please provide all value");
  }

  try {
    const boardResponse = await axios.get(`${BOARD_SERVICE_URL}/api/boards/${board_id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    const board = boardResponse.data.board;

    if (board.owner_id !== req.user.userId) {
      throw new UnAuthenticatedError("it's not your board");
    }

    const invitationWasSent = await Invitation.findOne({
      where: {
        recipient_id,
        board_id,
      },
    });

    const recipientUserResponse = await axios.get(`${USER_SERVICE_URL}/api/users/${recipient_id}`, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
    const recipientUser = recipientUserResponse.data.user;

    if (!recipientUser) {
      throw new NotFoundError("Not found recipient user");
    }

    if (invitationWasSent) {
      try {
        await axios.post(`${REALTIME_SERVICE_URL}/api/events/invitation-sent`, {
          recipientId: recipient_id,
          senderId: req.user.userId,
          boardId: board_id,
          boardName: board.board_name,
          senderDisplayName: recipientUser.displayName,
        });
      } catch (error) {
        console.error("Failed to emit invitation sent event:", error);
      }

      return res.status(StatusCodes.OK).json({
        msg: `Invited ${recipientUser?.displayName} to ${board.board_name} board`,
      });
    }

    await Invitation.create({
      recipient_id: recipientUser?.id,
      sender_id: req?.user?.userId,
      board_id,
    });

    try {
      await axios.post(`${REALTIME_SERVICE_URL}/api/events/invitation-sent`, {
        recipientId: recipient_id,
        senderId: req.user.userId,
        boardId: board_id,
        boardName: board.board_name,
        senderDisplayName: recipientUser.displayName,
      });
    } catch (error) {
      console.error("Failed to emit invitation sent event:", error);
    }

    return res.status(StatusCodes.OK).json({
      msg: `Invited ${recipientUser?.displayName} to ${board.board_name} board`,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new NotFoundError("Board or user not found");
    }
    throw error;
  }
};

const acceptInvitation = async (req: Request, res: Response) => {
  const { sender_id, board_id } = req.body;

  const invitation = await Invitation.findOne({
    where: {
      recipient_id: req.user?.userId,
      board_id,
      sender_id,
    },
  });

  if (!invitation) {
    throw new NotFoundError("Not found your invitation");
  }

  invitation.status = "accepted";

  try {
    await axios.post(`${BOARD_SERVICE_URL}/api/boards/${board_id}/members`, {
      user_id: req.user?.userId
    }, {
      headers: {
        Authorization: req.headers.authorization
      }
    });
  } catch (error) {
    console.error("Failed to add user to board:", error);
    throw new BadRequestError("Failed to accept invitation - could not add user to board");
  }

  await invitation.save();

  const invitations = await Invitation.findAll({
    where: {
      recipient_id: req.user?.userId,
    },
    attributes: ["id", "status", "createdAt", "recipient_id", "sender_id", "board_id"],
    order: [["createdAt", "DESC"]],
  });

  res.status(StatusCodes.OK).json(invitations);
};

const declineInvitation = async (req: Request, res: Response) => {
  const { sender_id, board_id } = req.body;

  const invitation = await Invitation.findOne({
    where: {
      recipient_id: req.user?.userId,
      board_id,
      sender_id,
    },
  });

  if (!invitation) {
    throw new NotFoundError("Not found your invitation");
  }

  if (invitation.status === "accepted") {
    throw new BadRequestError("Invitation has already been accepted");
  }

  await invitation.destroy();
  const invitations = await Invitation.findAll({
    where: {
      recipient_id: req.user?.userId,
    },
    attributes: ["id", "status", "createdAt", "recipient_id", "sender_id", "board_id"],
    order: [["createdAt", "DESC"]],
  });

  res.status(StatusCodes.OK).json(invitations);
};

const readInvitations = async (req: Request, res: Response) => {
  await Invitation.update(
    { seen: true },
    {
      where: { recipient_id: req.user?.userId },
    }
  );
  res.status(StatusCodes.OK).json({ msg: "Invitations were read" });
};

export {
  createBoardInvitation,
  acceptInvitation,
  declineInvitation,
  readInvitations,
};