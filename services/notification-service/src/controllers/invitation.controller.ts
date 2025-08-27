import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors";
import Invitation from "../models/Invitation";
import "express-async-errors";
import { REALTIME_SERVICE_URL } from "../config/application.config";
import boardService from "../services/boardService";
import userService from "../services/userService";
import axios from "axios"

const createBoardInvitation = async (req: Request, res: Response) => {
  const { recipient_id } = req.body;
  const { board_id } = req.params;
  if (!board_id || !recipient_id || typeof req.user?.userId === "undefined") {
    throw new BadRequestError("Please provide all value");
  }

  try {
    const boardResponse = await boardService.getBoardById(
      board_id,
      req.headers.authorization
    );
    const board = boardResponse.board;

    if (board.owner_id !== req.user.userId) {
      throw new UnAuthenticatedError("it's not your board");
    }

    const recipientUser = await userService.getUserById(recipient_id);
    if (!recipientUser) {
      throw new NotFoundError("Not found recipient user");
    }

    // if (invitationWasSent) {
    //   try {
    //     await axios.post(`${REALTIME_SERVICE_URL}/api/events/invitation-sent`, {
    //       recipientId: recipient_id,
    //       senderId: req.user.userId,
    //       boardId: board_id,
    //       boardName: board.board_name,
    //       senderDisplayName: recipientUser.displayName,
    //     });
    //   } catch (error) {
    //     console.error("Failed to emit invitation sent event:", error);
    //   }

    //   return res.status(StatusCodes.OK).json({
    //     msg: `Invited ${recipientUser?.displayName} to ${board.board_name} board`,
    //   });
    // }

    await Invitation.create({
      recipient_id: recipientUser?.user_id,
      sender_id: req?.user?.userId,
      board_id,
    });

    // try {
    //   await axios.post(`${REALTIME_SERVICE_URL}/api/events/invitation-sent`, {
    //     recipientId: recipient_id,
    //     senderId: req.user.userId,
    //     boardId: board_id,
    //     boardName: board.board_name,
    //     senderDisplayName: recipientUser.displayName,
    //   });
    // } catch (error) {
    //   console.error("Failed to emit invitation sent event:", error);
    // }

    return res.status(StatusCodes.OK).json({
      msg: `Invited ${recipientUser?.display_name} to ${board.board_name} board`,
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
  const { invitation_id } = req.params;
  console.log(
    "============================================================================"
  );
  console.log("Accept Invitation");
  console.log(
    "============================================================================"
  );

  const invitation = await Invitation.findOne({
    where: {
      id: invitation_id,
      recipient_id: req.user?.userId,
      board_id,
      sender_id,
    },
  });

  if (!invitation) {
    throw new NotFoundError("Not found your invitation");
  }

  console.log(
    "============================================================================"
  );
  console.log("Accept Invitation");
  console.log(
    "============================================================================"
  );
  console.log(
    "============================================================================"
  );
  console.log("Accept Invitation");
  console.log(
    "============================================================================"
  );

  invitation.status = "accepted";

  try {
    await boardService.addBoardMember(
      board_id,
      { user_id: req.user?.userId },
      req.headers.authorization
    );
  } catch (error) {
    console.error("Failed to add user to board:", error);
    throw new BadRequestError(
      "Failed to accept invitation - could not add user to board"
    );
  }

  await invitation.save();

  const invitations = await Invitation.findAll({
    where: {
      recipient_id: req.user?.userId,
    },
    attributes: [
      "id",
      "status",
      "createdAt",
      "recipient_id",
      "sender_id",
      "board_id",
    ],
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
    attributes: [
      "id",
      "status",
      "createdAt",
      "recipient_id",
      "sender_id",
      "board_id",
    ],
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

const createBulkBoardInvitations = async (req: Request, res: Response) => {
  const { invitedMembers } = req.body;
  const { board_id } = req.params;

  console.log(
    "=========================================================================="
  );
  console.log("createBulkBoardInvitations");
  console.log(
    "=========================================================================="
  );

  if (
    !board_id ||
    !invitedMembers ||
    !Array.isArray(invitedMembers) ||
    typeof req.user?.userId === "undefined"
  ) {
    throw new BadRequestError(
      "Please provide board_id and invitedMembers array"
    );
  }

  try {
    console.log("111111");
    const boardResponse = await boardService.getBoardById(
      board_id,
      req.headers.authorization
    );
    const board = boardResponse.board;

    if (board.owner_id !== req.user.userId) {
      throw new UnAuthenticatedError("it's not your board");
    }

    const results = [];

    console.log("222222");

    for (const member of invitedMembers) {
      const { recipient_id } = member;

      console.log(member);

      if (!recipient_id) {
        results.push({
          recipient_id: null,
          success: false,
          message: "recipient_id is required",
        });
        continue;
      }

      console.log("33333");

      try {
        const invitationWasSent = await Invitation.findOne({
          where: {
            recipient_id,
            board_id,
          },
        });

        const recipientUserResponse = await userService.getUserById(
          recipient_id,
          req.headers.authorization
        );
        const recipientUser = recipientUserResponse;

        console.log(recipientUserResponse);
        console.log("444444");

        if (!recipientUser) {
          results.push({
            recipient_id,
            success: false,
            message: "Recipient user not found",
          });
          continue;
        }

        if (!invitationWasSent) {
          console.log("XXXXXXXXXXXXXXXXXx");
          await Invitation.create({
            recipient_id: recipient_id,
            sender_id: req.user.userId,
            board_id,
          });
        }

        console.log("love may");

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

        results.push({
          recipient_id,
          success: true,
          message: `Invited ${recipientUser.displayName} to ${board.board_name} board`,
        });
      } catch (memberError: any) {
        console.log("9999999");

        console.log(memberError);
        results.push({
          recipient_id,
          success: false,
          message:
            memberError.response?.status === 404
              ? "User not found"
              : "Failed to create invitation",
        });
      }
    }

    return res.status(StatusCodes.OK).json({
      message: "Bulk invitations processed",
      results,
      totalProcessed: invitedMembers.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new NotFoundError("Board not found");
    }
    throw error;
  }
};

export {
  createBoardInvitation,
  createBulkBoardInvitations,
  acceptInvitation,
  declineInvitation,
  readInvitations,
};
