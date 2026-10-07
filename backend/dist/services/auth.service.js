"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const repositories_1 = require("../repositories");
class AuthService {
    async hashPassword(password) {
        return bcryptjs_1.default.hash(password, 10);
    }
    async comparePassword(password, hash) {
        return bcryptjs_1.default.compare(password, hash);
    }
    generateToken(user) {
        return jsonwebtoken_1.default.sign({
            id: user.id,
            username: user.username,
            email: user.email,
        }, config_1.config.jwtSecret, { expiresIn: config_1.config.jwtExpiresIn });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
        }
        catch (err) {
            return null;
        }
    }
    async register(data) {
        const existingEmail = await repositories_1.userRepo.findByEmail(data.email);
        if (existingEmail) {
            throw new Error('An account with this email already exists.');
        }
        const existingUsername = await repositories_1.userRepo.findByUsername(data.username);
        if (existingUsername) {
            throw new Error('This username is already taken. Please choose another.');
        }
        const password_hash = await this.hashPassword(data.password);
        const user = await repositories_1.userRepo.create({
            name: data.name,
            username: data.username.toLowerCase(),
            email: data.email.toLowerCase(),
            password_hash,
            avatar_color: data.avatarColor || '#2563EB',
            profile_photo: data.profilePhoto || null,
        });
        const token = this.generateToken(user);
        const { password_hash: _, ...safeUser } = user;
        return { user: safeUser, token };
    }
    async login(identifier, password) {
        const user = (await repositories_1.userRepo.findByEmail(identifier)) || (await repositories_1.userRepo.findByUsername(identifier));
        if (!user || !user.password_hash) {
            throw new Error('Invalid credentials. Please verify your email/username and password.');
        }
        const isMatch = await this.comparePassword(password, user.password_hash);
        if (!isMatch) {
            throw new Error('Invalid credentials. Please verify your email/username and password.');
        }
        const token = this.generateToken(user);
        const { password_hash: _, ...safeUser } = user;
        return { user: safeUser, token };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
