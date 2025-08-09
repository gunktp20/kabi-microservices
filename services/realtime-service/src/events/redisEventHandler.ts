import { Server } from 'socket.io';
import { redisSubscriber } from '../config/redis';
import { userManager } from '../utils/userManager';

export const setupRedisEventHandlers = (io: Server) => {
  
  // Handle board events from other services
  redisSubscriber.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      
      // Board events
      if (channel.startsWith('board:updated:')) {
        const boardId = channel.split(':')[2];
        io.to(`board:${boardId}`).emit('board:updated', data);
      }
      
      // Column events  
      else if (channel.startsWith('column:updated:')) {
        const boardId = channel.split(':')[2];
        io.to(`board:${boardId}`).emit('column:updated', data);
      }
      
      // Task events
      else if (channel.startsWith('task:updated:')) {
        const boardId = channel.split(':')[2];
        io.to(`board:${boardId}`).emit('task:updated', data);
      }
      
      else if (channel.startsWith('task:assigned:')) {
        const boardId = channel.split(':')[2];
        io.to(`board:${boardId}`).emit('task:assigned', data);
      }
      
      else if (channel.startsWith('task:reordered:')) {
        const boardId = channel.split(':')[2];
        io.to(`board:${boardId}`).emit('task:reordered', data);
      }
      
      // Notification events
      else if (channel.startsWith('notification:offline:')) {
        const userId = channel.split(':')[2];
        
        // Check if user came online
        const user = userManager.getUserByUserId(userId);
        if (user) {
          io.to(user.socketId).emit('notification:received', data);
        }
      }
      
      else if (channel === 'notification:create') {
        // Handle notification creation from other services
        const { targetUserId } = data;
        const user = userManager.getUserByUserId(targetUserId);
        
        if (user) {
          io.to(user.socketId).emit('notification:received', data);
        }
      }
      
      else if (channel === 'notification:broadcast') {
        // Handle broadcast notifications
        const { targetUserIds, ...notificationData } = data;
        
        for (const userId of targetUserIds) {
          const user = userManager.getUserByUserId(userId);
          if (user) {
            io.to(user.socketId).emit('notification:received', {
              ...notificationData,
              targetUserId: userId,
            });
          }
        }
      }
      
      // User events from user service
      else if (channel.startsWith('user:')) {
        const eventType = channel.split(':')[1];
        
        if (eventType === 'updated') {
          // User profile updated
          const { userId } = data;
          const user = userManager.getUserByUserId(userId);
          
          if (user) {
            io.to(user.socketId).emit('user:profile_updated', data);
          }
        }
        
        else if (eventType === 'invited') {
          // User invited to board
          const { userId } = data;
          const user = userManager.getUserByUserId(userId);
          
          if (user) {
            io.to(user.socketId).emit('board:invitation_received', data);
          }
        }
      }
      
      // System-wide events
      else if (channel === 'system:maintenance') {
        // Maintenance notification
        io.emit('system:maintenance', data);
      }
      
      else if (channel === 'system:announcement') {
        // System announcement
        io.emit('system:announcement', data);
      }
      
    } catch (error) {
      console.error(`❌ Error handling Redis message on channel ${channel}:`, error);
    }
  });
  
  // Subscribe to additional channels
  const subscribeToChannels = async () => {
    try {
      // System-wide events
      await redisSubscriber.subscribe('system:maintenance');
      await redisSubscriber.subscribe('system:announcement');
      
      // Notification events
      await redisSubscriber.subscribe('notification:create');
      await redisSubscriber.subscribe('notification:broadcast');
      
      console.log('✅ Subscribed to Redis channels for cross-service events');
      
    } catch (error) {
      console.error('❌ Error subscribing to Redis channels:', error);
    }
  };
  
  subscribeToChannels();
  
  // Handle Redis connection events
  redisSubscriber.on('connect', () => {
    console.log('✅ Redis subscriber connected');
  });
  
  redisSubscriber.on('error', (error) => {
    console.error('❌ Redis subscriber error:', error);
  });
  
  redisSubscriber.on('reconnecting', () => {
    console.log('🔄 Redis subscriber reconnecting...');
  });
};