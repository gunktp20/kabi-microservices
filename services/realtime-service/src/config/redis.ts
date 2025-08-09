import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } from './application.config';

const redisConfig = {
  socket: {
    host: REDIS_HOST,
    port: Number(REDIS_PORT),
  },
  password: REDIS_PASSWORD || undefined,
};

// Redis client for pub/sub
export const redisPublisher = createClient(redisConfig);
export const redisSubscriber = createClient(redisConfig);
export const redisClient = createClient(redisConfig);

// Initialize Redis connections
export const initializeRedis = async () => {
  try {
    await Promise.all([
      redisPublisher.connect(),
      redisSubscriber.connect(),
      redisClient.connect(),
    ]);
    
    console.log('✅ Redis connections established');
    
    // Subscribe to channels for cross-service events
    await redisSubscriber.subscribe('board:*', (message, channel) => {
      console.log(`📨 Received message on ${channel}:`, message);
    });
    
    await redisSubscriber.subscribe('task:*', (message, channel) => {
      console.log(`📨 Received message on ${channel}:`, message);
    });
    
    await redisSubscriber.subscribe('user:*', (message, channel) => {
      console.log(`📨 Received message on ${channel}:`, message);
    });
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export default redisClient;