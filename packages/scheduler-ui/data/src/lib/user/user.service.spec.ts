import { TestBed } from '@angular/core/testing';
import { User, UserRole } from '@org/models';
import { firstValueFrom } from 'rxjs';
import { SEED_USERS } from '../seed/seed.tokens';
import { mockUser, mockUserDraft } from '../testing/mock-user';
import { UserService, userNotFoundMessage } from './user.service';

const MISSING_USER_ID = 'missing-user';

function setup(
  seededUsers: User[] = [
    mockUser.COORDINATOR,
    mockUser.MEMBER,
    mockUser.PROSPECT,
  ],
) {
  TestBed.configureTestingModule({
    providers: [{ provide: SEED_USERS, useValue: seededUsers }],
  });
  return { service: TestBed.inject(UserService), seededUsers };
}

describe('UserService', () => {
  describe('seeded users', () => {
    it('should start with the seeded users', async () => {
      const { service, seededUsers } = setup();

      expect(await firstValueFrom(service.getUsers())).toEqual(seededUsers);
    });

    it('should start without users when none are seeded', async () => {
      const { service } = setup([]);

      expect(await firstValueFrom(service.getUsers())).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should create a user with a generated id that can be retrieved', async () => {
      const { service } = setup();
      const draft = mockUserDraft();

      const created = await firstValueFrom(service.createUser(draft));

      expect(created).toEqual({ ...draft, id: created.id });
      expect(await firstValueFrom(service.getUserById(created.id))).toEqual(
        created,
      );
    });

    it('should generate a distinct id for each user', async () => {
      const { service } = setup();

      const first = await firstValueFrom(service.createUser(mockUserDraft()));
      const second = await firstValueFrom(service.createUser(mockUserDraft()));

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('getUsers', () => {
    it('should include created users', async () => {
      const { service } = setup();
      const created = await firstValueFrom(service.createUser(mockUserDraft()));

      expect(await firstValueFrom(service.getUsers())).toContainEqual(created);
    });

    it('should not expose internal state to mutation', async () => {
      const { service } = setup();
      const before = await firstValueFrom(service.getUsers());

      (await firstValueFrom(service.getUsers())).pop();

      expect(await firstValueFrom(service.getUsers())).toEqual(before);
    });
  });

  describe('getUsersByRole', () => {
    it.each(Object.values(UserRole))(
      'should only include seeded users with the %s role',
      async (role) => {
        const { service, seededUsers } = setup();

        const users = await firstValueFrom(service.getUsersByRole(role));

        expect(users).toEqual(
          seededUsers.filter((user) => user.roles.includes(role)),
        );
      },
    );

    it('should include created users with the role', async () => {
      const { service } = setup();
      const created = await firstValueFrom(
        service.createUser(mockUserDraft({ roles: [UserRole.Member] })),
      );

      const members = await firstValueFrom(
        service.getUsersByRole(UserRole.Member),
      );

      expect(members).toContainEqual(created);
    });

    it('should include a user with multiple roles under each of their roles', async () => {
      const { service } = setup();
      const roles = [UserRole.Coordinator, UserRole.Prospect];
      const created = await firstValueFrom(
        service.createUser(mockUserDraft({ roles })),
      );

      for (const role of roles) {
        expect(
          await firstValueFrom(service.getUsersByRole(role)),
        ).toContainEqual(created);
      }
    });

    it('should exclude users with other roles', async () => {
      const { service } = setup();
      const created = await firstValueFrom(
        service.createUser(mockUserDraft({ roles: [UserRole.Prospect] })),
      );

      const members = await firstValueFrom(
        service.getUsersByRole(UserRole.Member),
      );

      expect(members).not.toContainEqual(created);
    });
  });

  describe('getUserById', () => {
    it('should emit null when the user does not exist', async () => {
      const { service } = setup();

      expect(
        await firstValueFrom(service.getUserById(MISSING_USER_ID)),
      ).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should apply the changes and keep the id', async () => {
      const { service } = setup();
      const created = await firstValueFrom(service.createUser(mockUserDraft()));
      const changes = { displayName: 'Renamed User', roles: [UserRole.Member] };

      const updated = await firstValueFrom(
        service.updateUser(created.id, changes),
      );

      expect(updated).toEqual({ ...created, ...changes });
      expect(await firstValueFrom(service.getUserById(created.id))).toEqual(
        updated,
      );
    });

    it('should error when the user does not exist', async () => {
      const { service } = setup();

      await expect(
        firstValueFrom(service.updateUser(MISSING_USER_ID, {})),
      ).rejects.toThrow(userNotFoundMessage(MISSING_USER_ID));
    });
  });

  describe('deleteUser', () => {
    it('should remove the user', async () => {
      const { service } = setup();
      const created = await firstValueFrom(service.createUser(mockUserDraft()));

      await firstValueFrom(service.deleteUser(created.id), {
        defaultValue: undefined,
      });

      expect(await firstValueFrom(service.getUserById(created.id))).toBeNull();
    });

    it('should error when the user does not exist', async () => {
      const { service } = setup();

      await expect(
        firstValueFrom(service.deleteUser(MISSING_USER_ID)),
      ).rejects.toThrow(userNotFoundMessage(MISSING_USER_ID));
    });
  });
});
