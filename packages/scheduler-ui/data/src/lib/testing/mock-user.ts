import { ContactMethod, User, UserRole } from '@org/models';
import { UserDraft } from '../user/user.service';
import { nextMockId } from './mock-id';

const DEFAULT_DISPLAY_NAME = 'Mock User';
const DEFAULT_CONTACT_VALUE = '555-0100';

function createMockUserDraft(overrides: Partial<UserDraft> = {}): UserDraft {
  return {
    displayName: DEFAULT_DISPLAY_NAME,
    contact: [{ method: ContactMethod.Phone, value: DEFAULT_CONTACT_VALUE }],
    roles: [UserRole.Member],
    ...overrides,
  };
}

function createMockUser(overrides: Partial<User> = {}): User {
  return { id: nextMockId('user'), ...createMockUserDraft(), ...overrides };
}

/** Creates a user without an id, as it is before the service creates it */
export const mockUserDraft = createMockUserDraft;

/** Creates a user; the seeded users, one per role, are properties of the factory */
export const mockUser = Object.assign(createMockUser, {
  COORDINATOR: createMockUser({
    displayName: 'Mock Coordinator',
    contact: [{ method: ContactMethod.Phone, value: '555-0100' }],
    roles: [UserRole.Coordinator],
  }),
  MEMBER: createMockUser({
    displayName: 'Mock Member',
    contact: [{ method: ContactMethod.Signal, value: '555-0101' }],
    roles: [UserRole.Member],
  }),
  PROSPECT: createMockUser({
    displayName: 'Mock Prospect',
    contact: [{ method: ContactMethod.WhatsApp, value: '555-0102' }],
    roles: [UserRole.Prospect],
  }),
});
