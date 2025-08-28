import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const PORT = process.env.REALTIME_SERVICE_PORT || 3005;
const SERVICE_NAME = "realtime-service";

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 
  fs.readFileSync(path.join(__dirname, '../../../keys/public_key.pem'), 'utf8');

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
  JWT_PUBLIC_KEY,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  USER_SERVICE_URL,
  BOARD_SERVICE_URL,
  TASK_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
};