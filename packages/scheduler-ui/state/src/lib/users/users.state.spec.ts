import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { ContactMethod, User, UserRole } from '@org/models';
import { USERS_STATE_NAME } from './users.model';
import { UsersState } from './users.state';

const MISSING_USER_ID = 'missing-user';

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    displayName: 'Test User',
    contact: [{ method: ContactMethod.Phone, value: '555-0100' }],
    roles: [UserRole.Member],
    ...overrides,
  };
}

function setup(users: User[] = []) {
  TestBed.configureTestingModule({
    providers: [provideStore([UsersState])],
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
  describe('userById', () => {
    it('should select the user with the given id', () => {
      const user = createUser({ id: 'user-1' });
      const { store } = setup([user, createUser({ id: 'user-2' })]);

      expect(store.selectSnapshot(UsersState.userById(user.id))).toEqual(user);
    });

    it('should select null when no user has the given id', () => {
      const { store } = setup([createUser()]);

      expect(
        store.selectSnapshot(UsersState.userById(MISSING_USER_ID)),
      ).toBeNull();
    });
  });

  describe('usersByRole', () => {
    it.each(Object.values(UserRole))(
      'should select only the users with the %s role',
      (role) => {
        const users = Object.values(UserRole).map((userRole) =>
          createUser({ id: `user-${userRole}`, roles: [userRole] }),
        );
        const { store } = setup(users);

        expect(store.selectSnapshot(UsersState.usersByRole(role))).toEqual(
          users.filter((user) => user.roles.includes(role)),
        );
      },
    );

    it('should select a user with multiple roles under each of their roles', () => {
      const roles = [UserRole.Coordinator, UserRole.Member];
      const user = createUser({ roles });
      const { store } = setup([user]);

      for (const role of roles) {
        expect(store.selectSnapshot(UsersState.usersByRole(role))).toEqual([
          user,
        ]);
      }
    });

    it('should select an empty list when no user has the role', () => {
      const { store } = setup([createUser({ roles: [UserRole.Member] })]);

      expect(
        store.selectSnapshot(UsersState.usersByRole(UserRole.Coordinator)),
      ).toEqual([]);
    });
  });
});
