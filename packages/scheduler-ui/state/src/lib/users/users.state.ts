import { Injectable } from '@angular/core';
import { createSelector, State } from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { USERS_STATE_NAME, UsersStateModel } from './users.model';

@State<UsersStateModel>({
  name: USERS_STATE_NAME,
  defaults: { usersById: {} },
})
@Injectable()
export class UsersState {
  static userById(id: string) {
    return createSelector(
      [UsersState],
      (state: UsersStateModel): User | null => state.usersById[id] ?? null,
    );
  }

  static usersByRole(role: UserRole) {
    return createSelector([UsersState], (state: UsersStateModel): User[] =>
      Object.values(state.usersById).filter((user) =>
        user.roles.includes(role),
      ),
    );
  }
}
