import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.BOARD_SERVICE_PORT || 3002;
export const DB_NAME = process.env.DB_NAME || "kabi_board";
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "root_password";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || "3306";
export const JWT_SECRET_ACCESS = process.env.JWT_SECRET_ACCESS || "your-secret-key";
export const NODE_ENV = process.env.NODE_ENV || "development";