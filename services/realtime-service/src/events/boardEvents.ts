import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../utils/auth';
import { userManager } from '../utils/userManager';
import { redisPublisher } from '../config/redis';

export const handleBoardEvents = (io: Server, socket: AuthenticatedSocket) => {
  
  // Join a board room
  socket.on('board:join', async (data: { boardId: string }) => {
    try {
      const { boardId } = data;
      
      // Join socket room
      await socket.join(`board:${boardId}`);
      
      // Update user manager
      await userManager.joinBoard(socket.id, boardId);
      
      // Get users in this board
      const usersInBoard = userManager.getUsersInBoard(boardId);
      
      // Notify others in the board
      socket.to(`board:${boardId}`).emit('board:user_joined', {
        user: socket.user,
        usersInBoard: usersInBoard.length,
      });
      
      // Send current users to the joining user
      socket.emit('board:users_list', usersInBoard);
      
      console.log(`👥 User ${socket.user?.email} joined board ${boardId}`);
      
    } catch (error) {
      console.error('Error joining board:', error);
      socket.emit('error', { message: 'Failed to join board' });
    }
  });

  // Leave a board room
  socket.on('board:leave', async (data: { boardId: string }) => {
    try {
      const { boardId } = data;
      
      // Leave socket room
      await socket.leave(`board:${boardId}`);
      
      // Update user manager
      await userManager.leaveBoard(socket.id, boardId);
      
      // Notify others in the board
      socket.to(`board:${boardId}`).emit('board:user_left', {
        user: socket.user,
        usersInBoard: userManager.getUsersInBoard(boardId).length,
      });
      
      console.log(`👋 User ${socket.user?.email} left board ${boardId}`);
      
    } catch (error) {
      console.error('Error leaving board:', error);
      socket.emit('error', { message: 'Failed to leave board' });
    }
  });

  // Board updated (from other services)
  socket.on('board:updated', async (data: { boardId: string, changes: any }) => {
    const { boardId, changes } = data;
    
    // Broadcast to all users in the board
    io.to(`board:${boardId}`).emit('board:updated', {
      boardId,
      changes,
      updatedBy: socket.user?.userId,
      timestamp: new Date().toISOString(),
    });
    
    // Publish to Redis for other service instances
    await redisPublisher.publish(`board:updated:${boardId}`, JSON.stringify({
      boardId,
      changes,
      updatedBy: socket.user?.userId,
      timestamp: new Date().toISOString(),
    }));
  });

  // Column created/updated/deleted
  socket.on('column:updated', async (data: { boardId: string, columnId: string, action: string, column?: any }) => {
    const { boardId, columnId, action, column } = data;
    
    // Broadcast to board members
    io.to(`board:${boardId}`).emit('column:updated', {
      boardId,
      columnId,
      action, // 'created', 'updated', 'deleted'
      column,
      updatedBy: socket.user?.userId,
      timestamp: new Date().toISOString(),
    });
    
    // Publish to Redis
    await redisPublisher.publish(`column:updated:${boardId}`, JSON.stringify({
      boardId,
      columnId,
      action,
      column,
      updatedBy: socket.user?.userId,
      timestamp: new Date().toISOString(),
    }));
  });
};