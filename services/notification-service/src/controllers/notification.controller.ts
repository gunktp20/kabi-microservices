import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import Invitation from "../models/Invitation";
import Assignment from "../models/Assignment";
import { BadRequestError } from "../errors";
import axios from "axios";
import {
  USER_SERVICE_URL,
  BOARD_SERVICE_URL,
  TASK_SERVICE_URL,
} from "../config/application.config";

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
            axios.get(`${USER_SERVICE_URL}/api/users/${invitation.sender_id}`, {
              headers: { Authorization: req.headers.authorization }
            }),
            axios.get(`${USER_SERVICE_URL}/api/users/${invitation.recipient_id}`, {
              headers: { Authorization: req.headers.authorization }
            }),
            axios.get(`${BOARD_SERVICE_URL}/api/boards/${invitation.board_id}`, {
              headers: { Authorization: req.headers.authorization }
            })
          ]);

          return {
            ...invitation.toJSON(),
            sender: senderResponse.data.user,
            recipient: recipientResponse.data.user,
            board: boardResponse.data.board
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
            axios.get(`${USER_SERVICE_URL}/api/users/${assignment.sender_id}`, {
              headers: { Authorization: req.headers.authorization }
            }),
            axios.get(`${USER_SERVICE_URL}/api/users/${assignment.assignee_id}`, {
              headers: { Authorization: req.headers.authorization }
            }),
            axios.get(`${TASK_SERVICE_URL}/api/tasks/${assignment.task_id}`, {
              headers: { Authorization: req.headers.authorization }
            })
          ]);

          const boardResponse = await axios.get(`${BOARD_SERVICE_URL}/api/boards/${assignment.board_id}`, {
            headers: { Authorization: req.headers.authorization }
          });

          return {
            ...assignment.toJSON(),
            sender: senderResponse.data.user,
            assignee: assigneeResponse.data.user,
            task: {
              ...taskResponse.data.task,
              Board: boardResponse.data.board
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