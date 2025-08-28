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

    // Get the recipient's socket connection
    const recipientUser = userManager.getUserByUserId(recipientId);

    if (recipientUser && ioInstance) {
      // Send real-time notification to recipient if they are online
      ioInstance.to(recipientUser.socketId).emit('notification:invitation_received', {
        type: 'invitation_received',
        boardId,
        boardName,
        senderId,
        senderDisplayName,
        timestamp: new Date().toISOString(),
        message: `${senderDisplayName} invited you to join "${boardName}" board`
      });

      console.log(`📨 Invitation notification sent to ${recipientUser.email} for board: ${boardName}`);
    } else {
      console.log(`📭 Recipient ${recipientId} is offline - notification not sent in real-time`);
    }

    // Send notification to sender as confirmation (optional)
    const senderUser = userManager.getUserByUserId(senderId);
    if (senderUser && ioInstance) {
      ioInstance.to(senderUser.socketId).emit('notification:invitation_sent_confirmation', {
        type: 'invitation_sent_confirmation',
        recipientId,
        boardId,
        boardName,
        timestamp: new Date().toISOString(),
        message: `Invitation sent to join "${boardName}" board`
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Invitation notification processed',
      recipientOnline: !!recipientUser,
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
    const senderUser = userManager.getUserByUserId(senderId);
    if (senderUser && ioInstance) {
      ioInstance.to(senderUser.socketId).emit('notification:invitation_accepted', {
        type: 'invitation_accepted',
        boardId,
        boardName,
        recipientId,
        recipientDisplayName,
        timestamp: new Date().toISOString(),
        message: `${recipientDisplayName} accepted your invitation to join "${boardName}" board`
      });

      console.log(`✅ Invitation acceptance notification sent to ${senderUser.email} for board: ${boardName}`);
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