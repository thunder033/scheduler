import { User } from '@org/models';

export const USERS_STATE_NAME = 'users';

export interface UsersStateModel {
  usersById: Record<string, User>;
}
