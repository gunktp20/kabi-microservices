import dotenv from "dotenv";
import fs from "fs";
import path from "path";
dotenv.config();

const PORT = process.env.USER_SERVICE_PORT || 3001;
const SERVICE_NAME = "user-service";

const CLIENT_URL = process.env.CLIENT_URL || "";
const SECRET_VERIFY_EMAIL = process.env.SECRET_VERIFY_EMAIL || "";
// Load RSA private key for signing JWTs
const JWT_PRIVATE_KEY = process.env.JWT_PRIVATE_KEY || 
  fs.readFileSync(path.join(__dirname, '../../../keys/private_key.pem'), 'utf8');

const AUTH_EMAIL = process.env.AUTH_EMAIL || "";
const AUTH_PASS = process.env.AUTH_PASS || "";

const EXPIRES_IN_ACCESS_TOKEN = process.env.EXPIRES_IN_ACCESS_TOKEN || "";
const JWT_SECRET_REFRESH = process.env.JWT_SECRET_REFRESH || "";
const EXPIRES_IN_REFRESH_TOKEN = process.env.EXPIRES_IN_REFRESH_TOKEN || "7d";

export const DB_NAME = process.env.DB_NAME || "kabi_user";
export const DB_USERNAME = process.env.DB_USERNAME || "root";
export const DB_PASSWORD = process.env.DB_PASSWORD || "root_password";
export const DB_HOST = process.env.DB_HOST || "localhost";
export const DB_PORT = process.env.DB_PORT || "3306";
export const NODE_ENV = process.env.NODE_ENV || "development";

export {
  PORT,
  SERVICE_NAME,
  CLIENT_URL,
  SECRET_VERIFY_EMAIL,
  JWT_PRIVATE_KEY,
  JWT_SECRET_REFRESH,
  AUTH_EMAIL, 
  AUTH_PASS,
  EXPIRES_IN_ACCESS_TOKEN,
  EXPIRES_IN_REFRESH_TOKEN,
};