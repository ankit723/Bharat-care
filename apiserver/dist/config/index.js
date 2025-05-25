"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
exports.default = {
    port: process.env.PORT || 9001,
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key', // In production, use a secure secret
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};
