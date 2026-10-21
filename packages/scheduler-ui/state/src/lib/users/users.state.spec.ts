import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { SEED_USERS } from '@org/scheduler-ui/data';
import { mockUser } from '@org/scheduler-ui/data/testing';
import { firstValueFrom } from 'rxjs';
import { LoadUsers } from './users.actions';
import { USERS_STATE_NAME } from './users.model';
import { UsersState } from './users.state';

const MISSING_USER_ID = 'missing-user';

function setup(users: User[] = [], seededUsers: User[] = []) {
  TestBed.configureTestingModule({
    providers: [
      provideStore([UsersState]),
      { provide: SEED_USERS, useValue: seededUsers },
    ],
  });

  const store = TestBed.inject(Store);
  store.reset({
    [USERS_STATE_NAME]: {
      usersById: Object.fromEntries(users.map((user) => [user.id, user])),
    },
  });

  return { store };
}

describe('UsersState', () => {
  describe('LoadUsers', () => {
    it('should load the seeded users of the service', async () => {
      const seededUsers = [mockUser.COORDINATOR, mockUser.MEMBER];
      const { store } = setup([], seededUsers);

      await firstValueFrom(store.dispatch(new LoadUsers()));

      expect(store.selectSnapshot(UsersState.usersById)).toEqual(
        Object.fromEntries(seededUsers.map((user) => [user.id, user])),
      );
    });

    it('should replace the users that were loaded before', async () => {
      const stale = mockUser({ id: 'stale-user' });
      const { store } = setup([stale], [mockUser.MEMBER]);

      await firstValueFrom(store.dispatch(new LoadUsers()));

      expect(store.selectSnapshot(UsersState.userById(stale.id))).toBeNull();
    });
  });

  describe('usersById', () => {
    it('should select the users by their ids', () => {
      const users = [mockUser.MEMBER, mockUser.COORDINATOR];
      const { store } = setup(users);

      expect(store.selectSnapshot(UsersState.usersById)).toEqual({
        [users[0].id]: users[0],
        [users[1].id]: users[1],
      });
    });
  });

  describe('userById', () => {
    it('should select the user with the given id', () => {
      const user = mockUser.MEMBER;
      const { store } = setup([user, mockUser.COORDINATOR]);

      expect(store.selectSnapshot(UsersState.userById(user.id))).toEqual(user);
    });

    it('should select null when no user has the given id', () => {
      const { store } = setup([mockUser.MEMBER]);

      expect(
        store.selectSnapshot(UsersState.userById(MISSING_USER_ID)),
      ).toBeNull();
    });
  });

  describe('usersByRole', () => {
    it.each(Object.values(UserRole))(
      'should select only the users with the %s role',
      (role) => {
        const users = [
          mockUser.COORDINATOR,
          mockUser.MEMBER,
          mockUser.PROSPECT,
        ];
        const { store } = setup(users);

        expect(store.selectSnapshot(UsersState.usersByRole(role))).toEqual(
          users.filter((user) => user.roles.includes(role)),
        );
      },
    );

    it('should select a user with multiple roles under each of their roles', () => {
      const roles = [UserRole.Coordinator, UserRole.Member];
      const user = mockUser({ roles });
      const { store } = setup([user]);

      for (const role of roles) {
        expect(store.selectSnapshot(UsersState.usersByRole(role))).toEqual([
          user,
        ]);
      }
    });

    it('should select an empty list when no user has the role', () => {
      const { store } = setup([mockUser.MEMBER]);

      expect(
        store.selectSnapshot(UsersState.usersByRole(UserRole.Coordinator)),
      ).toEqual([]);
    });
  });
});
