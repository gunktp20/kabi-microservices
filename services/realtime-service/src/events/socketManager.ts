import { Server } from 'socket.io';
import { AuthenticatedSocket, authenticateSocket } from '../utils/auth';
import { userManager } from '../utils/userManager';
import { handleBoardEvents } from './boardEvents';
import { handleTaskEvents } from './taskEvents';
import { handleNotificationEvents } from './notificationEvents';

export const setupSocketHandlers = (io: Server) => {
  
  // Authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', async (socket: AuthenticatedSocket) => {
    try {
      // Add user to online users
      const user = await userManager.addUser(socket);
      
      // Send welcome message
      socket.emit('connected', {
        message: 'Connected to Kabi Real-time Service',
        userId: user.userId,
        socketId: socket.id,
        timestamp: new Date().toISOString(),
      });
      
      // Broadcast user online status
      socket.broadcast.emit('user:online', {
        userId: user.userId,
        email: user.email,
        timestamp: new Date().toISOString(),
      });
      
      // Setup event handlers
      handleBoardEvents(io, socket);
      handleTaskEvents(io, socket);
      handleNotificationEvents(io, socket);
      
      // Handle heartbeat/ping
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: new Date().toISOString() });
      });
      
      // Handle user status updates
      socket.on('user:status', (data: { status: 'active' | 'away' | 'busy' }) => {

        console.log("XXXXXXXXXXXX")
        socket.broadcast.emit('user:status_changed', {
          userId: user.userId,
          status: data.status,
          timestamp: new Date().toISOString(),
        });
      });
      
      // Handle generic message forwarding
      socket.on('message:send', (data: { 
        targetUserId?: string, 
        boardId?: string, 
        message: string, 
        type?: string 
      }) => {
        const messageData = {
          from: user.userId,
          fromEmail: user.email,
          message: data.message,
          type: data.type || 'message',
          timestamp: new Date().toISOString(),
        };
        
        if (data.targetUserId) {
          // Direct message
          const targetUser = userManager.getUserByUserId(data.targetUserId);
          if (targetUser) {
            io.to(targetUser.socketId).emit('message:received', messageData);
          }
        } else if (data.boardId) {
          // Board message
          socket.to(`board:${data.boardId}`).emit('message:received', {
            ...messageData,
            boardId: data.boardId,
          });
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', async (reason) => {
        console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
        
        const removedUser = await userManager.removeUser(socket.id);
        
        if (removedUser) {
          // Notify others about user going offline
          socket.broadcast.emit('user:offline', {
            userId: removedUser.userId,
            email: removedUser.email,
            timestamp: new Date().toISOString(),
          });
          
          // Leave all board rooms
          for (const boardId of removedUser.boardRooms) {
            socket.to(`board:${boardId}`).emit('board:user_left', {
              user: { userId: removedUser.userId, email: removedUser.email },
              usersInBoard: userManager.getUsersInBoard(boardId).length,
            });
          }
        }
      });
      
      // Error handling
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
      });
      
    } catch (error) {
      console.error('❌ Error setting up socket connection:', error);
      socket.emit('error', { message: 'Connection setup failed' });
      socket.disconnect();
    }
  });
  
  // Log connection stats every 30 seconds
  setInterval(() => {
    const onlineCount = userManager.getOnlineCount();
    console.log(`📊 Online users: ${onlineCount}`);
  }, 30000);
};