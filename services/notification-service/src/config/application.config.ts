import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3004;
export const DB_NAME = process.env.DB_NAME || "kabi_db";
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "password";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || "5432";
export const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "your-secret-key";
export const NODE_ENV = process.env.NODE_ENV || "development";
export const REALTIME_SERVICE_URL = process.env.REALTIME_SERVICE_URL || "http://localhost:3004";
export const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "http://localhost:3001";
export const BOARD_SERVICE_URL = process.env.BOARD_SERVICE_URL || "http://localhost:3002";
export const TASK_SERVICE_URL = process.env.TASK_SERVICE_URL || "http://localhost:3003";