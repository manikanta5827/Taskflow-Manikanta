import { Context } from 'hono';
import { authService } from '../services/authService';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export const authController = {
  async register(c: Context) {
    const body = await c.req.json();
    const data = registerSchema.parse(body);
    const result = await authService.register(data);
    return c.json(result, 201);
  },

  async login(c: Context) {
    const body = await c.req.json();
    const data = loginSchema.parse(body);
    const result = await authService.login(data);
    return c.json(result);
  },
};
