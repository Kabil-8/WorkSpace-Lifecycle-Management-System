import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logger } from '../config/logger.js';
const JWT_SECRET = process.env.JWT_SECRET || 'edusphere_jwt_secret_key_2026';
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, message: 'No authentication token provided' });
            return;
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        // Attach user from DB for fresh data
        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }
        req.user = user;
        next();
    }
    catch (err) {
        logger.warn({ err: err.message }, '[Auth] Token verification failed');
        res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};
// Optional auth — attaches user if token present, continues if not
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id).select('-passwordHash');
            if (user)
                req.user = user;
        }
    }
    catch {
        // Ignore errors — optional auth
    }
    next();
};
// Role-based access control
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ success: false, message: `Access denied. Required roles: ${roles.join(', ')}` });
            return;
        }
        next();
    };
};
