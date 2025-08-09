import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.REALTIME_SERVICE_PORT || 3005;
const SERVICE_NAME = "realtime-service";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "";

// Redis Configuration
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || "";

// Service URLs for health checks
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
const BOARD_SERVICE_URL = process.env.BOARD_SERVICE_URL || "http://localhost:3002";
const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://localhost:3003";
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";

export {
  PORT,
  SERVICE_NAME,
  CLIENT_URL,
  JWT_SECRET_ACCESS,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  USER_SERVICE_URL,
  BOARD_SERVICE_URL,
  TASK_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
};