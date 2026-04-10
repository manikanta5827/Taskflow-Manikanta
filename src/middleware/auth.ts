import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt.js';
import { UnauthenticatedError } from '../utils/errors.js';
import { userRepository } from '../repositories/userRepository.js';
import { logger } from '../config/logger.js';

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthenticatedError();
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const user = await userRepository.findActiveById(payload.userId);

    if (!user) {
      throw new UnauthenticatedError();
    }

    const { password, ...userWithoutPassword } = user;
    c.set('user', userWithoutPassword);
    await next();
  } catch (error) {
    logger.error('Authentication failed', error);
    throw new UnauthenticatedError();
  }
};
