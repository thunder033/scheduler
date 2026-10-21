import { User, UserRole } from '@org/models';
import { resetMockIds } from './mock-id';
import { mockUser } from './mock-user';

function setup(overrides: Partial<User> = {}) {
  resetMockIds();
  return { user: mockUser(overrides) };
}

describe('mockUser', () => {
  it('should create a user with every field populated', () => {
    const { user } = setup();

    expect(user.id).toBeTruthy();
    expect(user.displayName).toBeTruthy();
    expect(user.contact.length).toBeGreaterThan(0);
    expect(user.roles.length).toBeGreaterThan(0);
  });

  it('should apply the overrides over the defaults', () => {
    const overrides: Partial<User> = {
      displayName: 'Someone Else',
      roles: [UserRole.Coordinator],
    };

    const { user } = setup(overrides);

    expect(user).toMatchObject(overrides);
  });

  it('should give each user a distinct id', () => {
    const { user } = setup();

    expect(mockUser().id).not.toBe(user.id);
  });

  it('should keep an overridden id', () => {
    const { user } = setup({ id: 'custom-id' });

    expect(user.id).toBe('custom-id');
  });

  describe('seeded users', () => {
    it('should seed a user for each role with that role', () => {
      const seeded = {
        [UserRole.Coordinator]: mockUser.COORDINATOR,
        [UserRole.Member]: mockUser.MEMBER,
        [UserRole.Prospect]: mockUser.PROSPECT,
      };

      for (const [role, user] of Object.entries(seeded)) {
        expect(user.roles).toContain(role);
      }
    });

    it('should give every seeded user its own id', () => {
      const ids = [
        mockUser.COORDINATOR,
        mockUser.MEMBER,
        mockUser.PROSPECT,
      ].map(({ id }) => id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
