import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { userRepo } from '../repositories';
import { User } from '../models/types';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return null;
    }
  }

  async register(data: { name: string; username: string; email: string; password: string; avatarColor?: string; profilePhoto?: string }) {
    const existingEmail = await userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('An account with this email already exists.');
    }

    const existingUsername = await userRepo.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const password_hash = await this.hashPassword(data.password);
    const user = await userRepo.create({
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

  async login(identifier: string, password: string) {
    const user = (await userRepo.findByEmail(identifier)) || (await userRepo.findByUsername(identifier));
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

export const authService = new AuthService();
