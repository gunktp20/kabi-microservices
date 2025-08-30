import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Server } from 'socket.io';
import { userManager } from '../utils/userManager';

let ioInstance: Server;

export const setIOInstance = (io: Server) => {
  ioInstance = io;
};

export const invitationSent = async (req: Request, res: Response) => {
  try {
    const { recipientId, senderId, boardId, boardName, senderDisplayName } = req.body;

    if (!recipientId || !senderId || !boardId || !boardName || !senderDisplayName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing required fields: recipientId, senderId, boardId, boardName, senderDisplayName'
      });
    }

    console.log("invitationSent")

    // Get all recipient's socket connections
    const recipientConnections = userManager.getUserConnectionsByUserId(recipientId);

    if (recipientConnections.length > 0 && ioInstance) {
      // Send real-time notification to all recipient connections
      recipientConnections.forEach(connection => {
        ioInstance.to(connection.socketId).emit('notification:invitation_received', {
          type: 'invitation_received',
          boardId,
          boardName,
          senderId,
          senderDisplayName,
          timestamp: new Date().toISOString(),
          message: `${senderDisplayName} invited you to join "${boardName}" board`
        });
      });

      console.log(`📨 Invitation notification sent to ${recipientConnections.length} connection(s) of user ${recipientConnections[0]?.email} for board: ${boardName}`);
    } else {
      console.log(`📭 Recipient ${recipientId} is offline - notification not sent in real-time`);
    }

    // Send notification to sender as confirmation (optional)
    const senderConnections = userManager.getUserConnectionsByUserId(senderId);
    if (senderConnections.length > 0 && ioInstance) {
      senderConnections.forEach(connection => {
        ioInstance.to(connection.socketId).emit('notification:invitation_sent_confirmation', {
          type: 'invitation_sent_confirmation',
          recipientId,
          boardId,
          boardName,
          timestamp: new Date().toISOString(),
          message: `Invitation sent to join "${boardName}" board`
        });
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Invitation notification processed',
      recipientOnline: recipientConnections.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing invitation notification:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process invitation notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const invitationAccepted = async (req: Request, res: Response) => {
  try {
    const { senderId, recipientId, boardId, boardName, recipientDisplayName } = req.body;

    if (!senderId || !recipientId || !boardId || !boardName || !recipientDisplayName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing required fields: senderId, recipientId, boardId, boardName, recipientDisplayName'
      });
    }

    // Notify the board owner that invitation was accepted
    const senderConnections = userManager.getUserConnectionsByUserId(senderId);
    if (senderConnections.length > 0 && ioInstance) {
      senderConnections.forEach(connection => {
        ioInstance.to(connection.socketId).emit('notification:invitation_accepted', {
          type: 'invitation_accepted',
          boardId,
          boardName,
          recipientId,
          recipientDisplayName,
          timestamp: new Date().toISOString(),
          message: `${recipientDisplayName} accepted your invitation to join "${boardName}" board`
        });
      });

      console.log(`✅ Invitation acceptance notification sent to ${senderConnections.length} connection(s) of user ${senderConnections[0]?.email} for board: ${boardName}`);
    }

    // Notify all board members that a new member joined
    ioInstance.to(`board:${boardId}`).emit('board:member_joined', {
      type: 'member_joined',
      boardId,
      boardName,
      newMember: {
        userId: recipientId,
        displayName: recipientDisplayName
      },
      timestamp: new Date().toISOString(),
      message: `${recipientDisplayName} joined the board`
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Invitation acceptance notification processed',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing invitation acceptance notification:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process invitation acceptance notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const taskAssigned = async (req: Request, res: Response) => {
  try {
    const { assigneeId, assignerId, taskId, taskName, boardId, boardName, assignerDisplayName } = req.body;

    if (!assigneeId || !assignerId || !taskId || !taskName || !boardId || !boardName || !assignerDisplayName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: 'Missing required fields: assigneeId, assignerId, taskId, taskName, boardId, boardName, assignerDisplayName'
      });
    }
    console.log("==================================================================")
    console.log("taskAssigned")
     console.log("==================================================================")

    // Get all assignee's socket connections
    const assigneeConnections = userManager.getUserConnectionsByUserId(assigneeId);

    if (assigneeConnections.length > 0 && ioInstance) {
      // Send real-time notification to all assignee connections
      assigneeConnections.forEach(connection => {
        ioInstance.to(connection.socketId).emit('notification:task_assigned', {
          type: 'task_assigned',
          taskId,
          taskName,
          boardId,
          boardName,
          assignerId,
          assignerDisplayName,
          timestamp: new Date().toISOString(),
          message: `${assignerDisplayName} assigned you to "${taskName}" in "${boardName}" board`
        });
      });

      console.log(`📋 Task assignment notification sent to ${assigneeConnections.length} connection(s) of user ${assigneeConnections[0]?.email} for task: ${taskName}`);
    } else {
      console.log(`📭 Assignee ${assigneeId} is offline - notification not sent in real-time`);
    }

    // Send notification to assigner as confirmation (optional)
    const assignerConnections = userManager.getUserConnectionsByUserId(assignerId);
    if (assignerConnections.length > 0 && ioInstance) {
      assignerConnections.forEach(connection => {
        ioInstance.to(connection.socketId).emit('notification:task_assigned_confirmation', {
          type: 'task_assigned_confirmation',
          assigneeId,
          taskId,
          taskName,
          boardId,
          boardName,
          timestamp: new Date().toISOString(),
          message: `Task "${taskName}" has been assigned`
        });
      });
    }

    // Notify all board members that a task was assigned
    ioInstance.to(`board:${boardId}`).emit('board:task_assigned', {
      type: 'task_assigned_board',
      taskId,
      taskName,
      boardId,
      assignee: {
        userId: assigneeId,
        displayName: assigneeConnections[0]?.displayName || 'Unknown User'
      },
      assigner: {
        userId: assignerId,
        displayName: assignerDisplayName
      },
      timestamp: new Date().toISOString(),
      message: `${assignerDisplayName} assigned "${taskName}" to ${assigneeConnections[0]?.displayName || 'Unknown User'}`
    });

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Task assignment notification processed',
      assigneeOnline: assigneeConnections.length > 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing task assignment notification:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to process task assignment notification',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};