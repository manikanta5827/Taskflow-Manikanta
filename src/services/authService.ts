import { userRepository } from '../repositories/userRepository';
import { signToken } from '../utils/jwt';
import { ValidationError, UnauthenticatedError } from '../utils/errors';

export const authService = {
  async register(data: any) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError({ email: 'already exists' });
    }

    const hashedPassword = await Bun.password.hash(data.password, {
      algorithm: 'bcrypt',
      cost: 12,
    });

    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
      role: data.role || 'MEMBER',
    });

    const token = await signToken({ userId: user.id, email: user.email });

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },

  async login(data: any) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthenticatedError('invalid credentials');
    }

    const isValid = await Bun.password.verify(data.password, user.password);
    if (!isValid) {
      throw new UnauthenticatedError('invalid credentials');
    }

    const token = await signToken({ userId: user.id, email: user.email });

    const { password, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  },
};
