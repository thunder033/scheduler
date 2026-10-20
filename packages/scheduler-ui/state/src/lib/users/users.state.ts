import { inject, Injectable } from '@angular/core';
import {
  Action,
  createSelector,
  Selector,
  State,
  StateContext,
} from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { UserService } from '@org/scheduler-ui/data';
import { Observable, tap } from 'rxjs';
import { LoadUsers } from './users.actions';
import { USERS_STATE_NAME, UsersStateModel } from './users.model';

@State<UsersStateModel>({
  name: USERS_STATE_NAME,
  defaults: { usersById: {} },
})
@Injectable()
export class UsersState {
  private readonly userService = inject(UserService);

  @Selector()
  static usersById(state: UsersStateModel): Record<string, User> {
    return state.usersById;
  }

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

  @Action(LoadUsers)
  loadUsers(context: StateContext<UsersStateModel>): Observable<User[]> {
    return this.userService.getUsers().pipe(
      tap((users) =>
        context.patchState({
          usersById: Object.fromEntries(users.map((user) => [user.id, user])),
        }),
      ),
    );
  }
}
