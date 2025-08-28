import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { PORT, SERVICE_NAME, CLIENT_URL } from './config/application.config';
import { initializeRedis } from './config/redis';
import { setupSocketHandlers } from './events/socketManager';
import { setupRedisEventHandlers } from './events/redisEventHandler';
import { userManager } from './utils/userManager';
import { setIOInstance } from './controllers/eventController';
import eventRoutes from './routes/eventRoutes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS configuration
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));

app.use(express.json());

// API routes
app.use('/api/events', eventRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    onlineUsers: userManager.getOnlineCount(),
  });
});

// Service info endpoint
app.get('/', (req, res) => {
  res.json({
    service: SERVICE_NAME,
    version: '1.0.0',
    description: 'Real-time communication service with Socket.IO',
    endpoints: {
      health: '/health',
      socket: '/socket.io/',
    },
    onlineUsers: userManager.getOnlineCount(),
    timestamp: new Date().toISOString(),
  });
});

// Socket.IO setup
const io = new SocketIOServer(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Setup Socket.IO handlers
setupSocketHandlers(io);
// Set IO instance for event controller
setIOInstance(io);

const start = async () => {
  try {
    // Initialize Redis connections
    await initializeRedis();
    
    // Setup Redis event handlers
    setupRedisEventHandlers(io);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🔥 ${SERVICE_NAME} is running on port ${PORT}`);
      console.log(`🌐 WebSocket endpoint: ws://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Client URL allowed: ${CLIENT_URL}`);
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('🛑 Received SIGTERM, shutting down gracefully');
      server.close(() => {
        console.log('👋 Real-time service shut down');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT, shutting down gracefully');
      server.close(() => {
        console.log('👋 Real-time service shut down');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error starting real-time service:', error);
    process.exit(1);
  }
};

start();