"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const auth_service_1 = require("../services/auth.service");
const repositories_1 = require("../repositories");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
        return res.status(401).json({ error: 'Authentication token required.' });
    }
    const decoded = auth_service_1.authService.verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    const user = await repositories_1.userRepo.findById(decoded.id);
    if (!user) {
        return res.status(401).json({ error: 'User no longer exists.' });
    }
    const { password_hash, ...safeUser } = user;
    req.user = safeUser;
    next();
};
exports.authenticateToken = authenticateToken;
