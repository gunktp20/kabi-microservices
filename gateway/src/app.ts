import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import http from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ROUTES, WEBSOCKET_CONFIG, SERVICES } from './config/services';
import { createServiceProxy } from './middleware/proxy';
import { healthCheckHandler } from './middleware/healthCheck';
import { errorHandler, notFound } from './middlewares/error-handler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.GATEWAY_PORT || 3000;

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
const wsProxy = createProxyMiddleware({
  target: WEBSOCKET_CONFIG.target,
  changeOrigin: true,
  ws: true,
  logLevel: 'debug',
});

app.use(WEBSOCKET_CONFIG.path, wsProxy);
server.on('upgrade', wsProxy.upgrade);

// API Gateway routes
ROUTES.forEach(route => {
  console.log(`Setting up proxy: ${route.path} -> ${route.target}`);
  console.log("target : " , route.target)
  console.log("pathRewrite : " , route.pathRewrite)
  
  const proxyMiddleware = createServiceProxy({
    target: route.target,
    pathRewrite: route.pathRewrite
  });
  
  app.use(route.path, (req, res, next) => {
    console.log(`[DEBUG] Route matched: ${route.path} for ${req.method} ${req.url}`);
    console.log(`[DEBUG] Will proxy to: ${route.target}${req.url.replace(new RegExp(Object.keys(route.pathRewrite)[0]), Object.values(route.pathRewrite)[0])}`);
    proxyMiddleware(req, res, next);
  });
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

const start = async () => {
  try {
    // Test connectivity to services
    console.log('🔍 Testing service connectivity...');
    const http = require('http');
    
    for (const service of Object.values(SERVICES)) {
      try {
        const url = new URL(service.url);
        const options = {
          hostname: url.hostname,
          port: url.port,
          path: '/health',
          method: 'GET',
          timeout: 2000
        };
        
        await new Promise((resolve, reject) => {
          const req = http.request(options, (res: any) => {
            console.log(`✅ ${service.name} is reachable at ${service.url}`);
            resolve(res);
          });
          
          req.on('error', (err: any) => {
            console.log(`❌ ${service.name} is NOT reachable at ${service.url} - ${err.message}`);
            resolve(null);
          });
          
          req.on('timeout', () => {
            console.log(`⏱️ ${service.name} timeout at ${service.url}`);
            req.destroy();
            resolve(null);
          });
          
          req.setTimeout(2000);
          req.end();
        });
      } catch (err) {
        console.log(`❌ Error testing ${service.name}: ${err}`);
      }
    }
    
    server.listen(PORT, () => {
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