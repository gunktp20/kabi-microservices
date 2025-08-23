import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

export const PORT = process.env.BOARD_SERVICE_PORT || 3002;
export const DB_NAME = process.env.DB_NAME || "kabi_board";
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "root_password";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || "3306";
export const CLIENT_URL = process.env.CLIENT_URL || "";
// ? Load RSA public key for verifying JWTs
export const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 
  fs.readFileSync(path.join(__dirname, '../../../keys/public_key.pem'), 'utf8');
// export const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 
//   fs.readFileSync(path.join(__dirname, '../../../keys/wrong_public_key.pem'), 'utf8');
export const NODE_ENV = process.env.NODE_ENV || "development";
export const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || "http://localhost:3004";