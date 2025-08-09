import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { ROUTES, WEBSOCKET_CONFIG } from './config/services';
import { createServiceProxy } from './middleware/proxy';
import { healthCheckHandler } from './middleware/healthCheck';
import { errorHandler, notFound } from './middlewares/error-handler';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[Gateway] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', healthCheckHandler);

// WebSocket proxy for real-time service
console.log(`Setting up WebSocket proxy: ${WEBSOCKET_CONFIG.path} -> ${WEBSOCKET_CONFIG.target}`);
app.use(WEBSOCKET_CONFIG.path, createServiceProxy({
  target: WEBSOCKET_CONFIG.target,
  changeOrigin: WEBSOCKET_CONFIG.changeOrigin,
}));

// API Gateway routes
ROUTES.forEach(route => {
  console.log(`Setting up proxy: ${route.path} -> ${route.target}`);
  app.use(route.path, createServiceProxy({
    target: route.target,
    pathRewrite: route.pathRewrite
  }));
});

// Welcome endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Kabi API Gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: ROUTES.map(route => ({
      path: route.path,
      target: route.target
    }))
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

const start = () => {
  try {
    app.listen(PORT, () => {
      console.log(`🌐 API Gateway is running on port ${PORT}`);
      console.log(`📊 Health check available at http://localhost:${PORT}/health`);
      console.log(`🔗 Available routes:`);
      ROUTES.forEach(route => {
        console.log(`   ${route.path} -> ${route.target}`);
      });
    });
  } catch (err) {
    console.error('Error starting API Gateway:', err);
    process.exit(1);
  }
};

start();