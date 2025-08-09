import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../utils/auth';
import { redisPublisher } from '../config/redis';

export const handleTaskEvents = (io: Server, socket: AuthenticatedSocket) => {
  
  // Task created/updated/deleted
  socket.on('task:updated', async (data: { 
    boardId: string, 
    taskId: string, 
    action: string, 
    task?: any, 
    oldColumnId?: string,
    newColumnId?: string 
  }) => {
    try {
      const { boardId, taskId, action, task, oldColumnId, newColumnId } = data;
      
      const eventData = {
        boardId,
        taskId,
        action, // 'created', 'updated', 'deleted', 'moved'
        task,
        oldColumnId,
        newColumnId,
        updatedBy: socket.user?.userId,
        timestamp: new Date().toISOString(),
      };
      
      // Broadcast to all users in the board
      io.to(`board:${boardId}`).emit('task:updated', eventData);
      
      // Publish to Redis for other service instances
      await redisPublisher.publish(`task:updated:${boardId}`, JSON.stringify(eventData));
      
      console.log(`📝 Task ${action}: ${taskId} in board ${boardId} by ${socket.user?.email}`);
      
    } catch (error) {
      console.error('Error handling task update:', error);
      socket.emit('error', { message: 'Failed to update task' });
    }
  });

  // Task assignment changed
  socket.on('task:assigned', async (data: { 
    boardId: string, 
    taskId: string, 
    assigneeId: string, 
    assigneeName?: string 
  }) => {
    try {
      const { boardId, taskId, assigneeId, assigneeName } = data;
      
      const eventData = {
        boardId,
        taskId,
        assigneeId,
        assigneeName,
        assignedBy: socket.user?.userId,
        timestamp: new Date().toISOString(),
      };
      
      // Broadcast to board members
      io.to(`board:${boardId}`).emit('task:assigned', eventData);
      
      // Publish to Redis
      await redisPublisher.publish(`task:assigned:${boardId}`, JSON.stringify(eventData));
      
      console.log(`👤 Task ${taskId} assigned to ${assigneeId} in board ${boardId}`);
      
    } catch (error) {
      console.error('Error handling task assignment:', error);
      socket.emit('error', { message: 'Failed to assign task' });
    }
  });

  // Task position changed (drag & drop)
  socket.on('task:reordered', async (data: { 
    boardId: string, 
    tasks: Array<{ taskId: string, position: number, columnId: string }> 
  }) => {
    try {
      const { boardId, tasks } = data;
      
      const eventData = {
        boardId,
        tasks,
        reorderedBy: socket.user?.userId,
        timestamp: new Date().toISOString(),
      };
      
      // Broadcast to board members (excluding sender)
      socket.to(`board:${boardId}`).emit('task:reordered', eventData);
      
      // Publish to Redis
      await redisPublisher.publish(`task:reordered:${boardId}`, JSON.stringify(eventData));
      
      console.log(`🔄 Tasks reordered in board ${boardId} by ${socket.user?.email}`);
      
    } catch (error) {
      console.error('Error handling task reorder:', error);
      socket.emit('error', { message: 'Failed to reorder tasks' });
    }
  });

  // User typing indicator
  socket.on('task:typing', (data: { boardId: string, taskId: string, isTyping: boolean }) => {
    const { boardId, taskId, isTyping } = data;
    
    // Broadcast typing status to others in the board
    socket.to(`board:${boardId}`).emit('task:typing', {
      taskId,
      userId: socket.user?.userId,
      userEmail: socket.user?.email,
      isTyping,
      timestamp: new Date().toISOString(),
    });
  });
};