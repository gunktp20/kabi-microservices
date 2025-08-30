import { AuthenticatedSocket } from './auth';
import { redisClient } from '../config/redis';

export interface OnlineUser {
  userId: string;
  email: string;
  socketId: string;
  displayName?: string;
  joinedAt: Date;
  boardRooms: string[];
}

export class UserManager {
  private onlineUsers = new Map<string, OnlineUser>();

  async addUser(socket: AuthenticatedSocket): Promise<OnlineUser> {
    if (!socket.user) {
      throw new Error('User not authenticated');
    }

    const user: OnlineUser = {
      userId: socket.user.userId,
      email: socket.user.email,
      socketId: socket.id,
      joinedAt: new Date(),
      boardRooms: [],
    };

    this.onlineUsers.set(socket.id, user);
    
    // Store in Redis for cross-service access
    await redisClient.setEx(
      `online_user:${socket.user.userId}`, 
      3600, // 1 hour TTL
      JSON.stringify(user)
    );

    console.log(`👤 User connected: ${user.email} (${user.userId})`);
    return user;
  }

  async removeUser(socketId: string): Promise<OnlineUser | null> {
    const user = this.onlineUsers.get(socketId);
    if (!user) return null;

    this.onlineUsers.delete(socketId);
    
    // Remove from Redis
    await redisClient.del(`online_user:${user.userId}`);

    console.log(`👋 User disconnected: ${user.email} (${user.userId})`);
    return user;
  }

  getUser(socketId: string): OnlineUser | undefined {
    return this.onlineUsers.get(socketId);
  }

  getUserByUserId(userId: string): OnlineUser | undefined {
    for (const user of this.onlineUsers.values()) {
      if (user.userId === userId) {
        return user;
      }
    }
    return undefined;
  }

  getUserConnectionsByUserId(userId: string): OnlineUser[] {
    const userConnections: OnlineUser[] = [];
    for (const user of this.onlineUsers.values()) {
      if (user.userId === userId) {
        userConnections.push(user);
      }
    }
    return userConnections;
  }

  getAllUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  getUsersInBoard(boardId: string): OnlineUser[] {
    return this.getAllUsers().filter(user => 
      user.boardRooms.includes(boardId)
    );
  }

  async joinBoard(socketId: string, boardId: string): Promise<boolean> {
    const user = this.onlineUsers.get(socketId);
    if (!user) return false;

    if (!user.boardRooms.includes(boardId)) {
      user.boardRooms.push(boardId);
      
      // Update Redis
      await redisClient.setEx(
        `online_user:${user.userId}`, 
        3600,
        JSON.stringify(user)
      );
    }

    return true;
  }

  async leaveBoard(socketId: string, boardId: string): Promise<boolean> {
    const user = this.onlineUsers.get(socketId);
    if (!user) return false;

    user.boardRooms = user.boardRooms.filter(room => room !== boardId);
    
    // Update Redis
    await redisClient.setEx(
      `online_user:${user.userId}`, 
      3600,
      JSON.stringify(user)
    );

    return true;
  }

  getOnlineCount(): number {
    return this.onlineUsers.size;
  }
}

export const userManager = new UserManager();