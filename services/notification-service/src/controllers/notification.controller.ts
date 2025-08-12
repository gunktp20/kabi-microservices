import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Invitation from "../models/Invitation";
import Assignment from "../models/Assignment";
import { BadRequestError } from "../errors";
import userService from "../services/userService";
import boardService from "../services/boardService";
import taskService from "../services/taskService";

const getAllNotifications = async (req: Request, res: Response) => {
  if (typeof req.user?.userId === "undefined") {
    throw new BadRequestError("Please provide all value");
  }

  try {
    const invitations = await Invitation.findAll({
      where: {
        recipient_id: req.user?.userId,
      },
      attributes: ["id", "status", "createdAt", "recipient_id", "sender_id", "board_id"],
      order: [["createdAt", "DESC"]],
    });

    const unreadInvitations = await Invitation.findAll({
      where: {
        seen: false,
        recipient_id: req.user?.userId,
      },
    });

    const assignments = await Assignment.findAll({
      where: {
        assignee_id: req?.user.userId,
      },
      attributes: ["id", "createdAt", "task_id", "board_id", "sender_id", "assignee_id", "seen"],
      order: [["createdAt", "DESC"]],
    });

    const unreadAssignments = await Assignment.findAll({
      where: {
        seen: false,
        assignee_id: req.user?.userId,
      },
    });

    const enrichedInvitations = await Promise.all(
      invitations.map(async (invitation) => {
        try {
          const [senderResponse, recipientResponse, boardResponse] = await Promise.all([
            userService.getUserById(invitation.sender_id, req.headers.authorization as string),
            userService.getUserById(invitation.recipient_id, req.headers.authorization as string),
            boardService.getBoardById(invitation.board_id, req.headers.authorization as string)
          ]);

          return {
            ...invitation.toJSON(),
            sender: senderResponse.user,
            recipient: recipientResponse.user,
            board: boardResponse.board
          };
        } catch (error) {
          console.error("Error enriching invitation:", error);
          return invitation.toJSON();
        }
      })
    );

    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        try {
          const [senderResponse, assigneeResponse, taskResponse] = await Promise.all([
            userService.getUserById(assignment.sender_id, req.headers.authorization as string),
            userService.getUserById(assignment.assignee_id, req.headers.authorization as string),
            taskService.getTaskById(assignment.task_id, req.headers.authorization as string)
          ]);

          const boardResponse = await boardService.getBoardById(assignment.board_id, req.headers.authorization as string);

          return {
            ...assignment.toJSON(),
            sender: senderResponse.user,
            assignee: assigneeResponse.user,
            task: {
              ...taskResponse.task,
              Board: boardResponse.board
            }
          };
        } catch (error) {
          console.error("Error enriching assignment:", error);
          return assignment.toJSON();
        }
      })
    );

    res.status(StatusCodes.OK).json({
      invitations: enrichedInvitations,
      assignments: enrichedAssignments,
      unreadInvitations: unreadInvitations.length,
      unreadAssignments: unreadAssignments.length,
      unreadNotifications: unreadInvitations.length + unreadAssignments.length,
    });
  } catch (error: any) {
    console.error("Error getting notifications:", error);
    if (error.response) {
      throw new BadRequestError(error.response.data.msg || "Failed to get notifications");
    }
    throw error;
  }
};

export { getAllNotifications };