import { User } from '@prisma/client';

export type UserContext = Omit<User, 'password'>;

export type AppVariables = {
  user: UserContext;
};
