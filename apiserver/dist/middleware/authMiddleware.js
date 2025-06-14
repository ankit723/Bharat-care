"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeAdmin = exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
// This is a placeholder for actual authentication logic
// In a real application, you would validate JWT tokens or other auth mechanisms
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'Authorization header is required' });
        return;
    }
    // Check if token format is correct
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'Token format is invalid. Use "Bearer <token>"' });
        return;
    }
    const token = parts[1];
    try {
        // Verify and decode the token
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwtSecret || 'your-secret-key');
        // Set user information in request
        req.user = {
            userId: decoded.id,
            role: decoded.role,
            verificationStatus: decoded.verificationStatus
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
// Role-based authorization middleware
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const authorizeAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
    }
    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
