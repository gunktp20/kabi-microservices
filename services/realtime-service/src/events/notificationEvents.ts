import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../utils/auth';
import { userManager } from '../utils/userManager';
import { redisPublisher } from '../config/redis';

export const handleNotificationEvents = (io: Server, socket: AuthenticatedSocket) => {
  
  // Send notification to specific user
  socket.on('notification:send', async (data: { 
    targetUserId: string, 
    type: string, 
    title: string, 
    message: string, 
    data?: any 
  }) => {
    try {
      const { targetUserId, type, title, message, data: notificationData } = data;
      
      // Find target user's socket
      const targetUser = userManager.getUserByUserId(targetUserId);
      
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        data: notificationData,
        from: socket.user?.userId,
        fromEmail: socket.user?.email,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      if (targetUser) {
        // User is online, send real-time notification
        io.to(targetUser.socketId).emit('notification:received', notification);
        console.log(`🔔 Notification sent to online user ${targetUserId}`);
      } else {
        // User is offline, store in Redis for later delivery
        await redisPublisher.publish(`notification:offline:${targetUserId}`, JSON.stringify(notification));
        console.log(`📥 Notification queued for offline user ${targetUserId}`);
      }
      
      // Publish to notification service for persistence
      await redisPublisher.publish('notification:create', JSON.stringify(notification));
      
    } catch (error) {
      console.error('Error sending notification:', error);
      socket.emit('error', { message: 'Failed to send notification' });
    }
  });

  // Broadcast notification to board members
  socket.on('notification:broadcast', async (data: { 
    boardId: string, 
    type: string, 
    title: string, 
    message: string, 
    excludeUserId?: string,
    data?: any 
  }) => {
    try {
      const { boardId, type, title, message, excludeUserId, data: notificationData } = data;
      
      const notification = {
        id: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        data: notificationData,
        boardId,
        from: socket.user?.userId,
        fromEmail: socket.user?.email,
        timestamp: new Date().toISOString(),
      };
      
      // Get users in board
      const boardUsers = userManager.getUsersInBoard(boardId);
      const targetUsers = excludeUserId 
        ? boardUsers.filter(user => user.userId !== excludeUserId)
        : boardUsers;
      
      // Send to online users in the board
      for (const user of targetUsers) {
        io.to(user.socketId).emit('notification:received', {
          ...notification,
          targetUserId: user.userId,
        });
      }
      
      // Publish to Redis for persistence
      await redisPublisher.publish('notification:broadcast', JSON.stringify({
        ...notification,
        targetUserIds: targetUsers.map(u => u.userId),
      }));
      
      console.log(`📢 Broadcast notification sent to ${targetUsers.length} users in board ${boardId}`);
      
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      socket.emit('error', { message: 'Failed to broadcast notification' });
    }
  });

  // Mark notification as read
  socket.on('notification:read', async (data: { notificationId: string }) => {
    try {
      const { notificationId } = data;
      
      // Publish to notification service to mark as read
      await redisPublisher.publish('notification:read', JSON.stringify({
        notificationId,
        userId: socket.user?.userId,
        readAt: new Date().toISOString(),
      }));
      
      console.log(`✅ Notification ${notificationId} marked as read by ${socket.user?.email}`);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      socket.emit('error', { message: 'Failed to mark notification as read' });
    }
  });

  // Get unread notifications count
  socket.on('notification:get_unread_count', async () => {
    try {
      // Request from notification service
      await redisPublisher.publish('notification:get_unread_count', JSON.stringify({
        userId: socket.user?.userId,
        requestId: `req_${Date.now()}_${socket.id}`,
      }));
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      socket.emit('error', { message: 'Failed to get unread count' });
    }
  });
};