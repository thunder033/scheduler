import { Injectable } from '@angular/core';
import { ContactMethod, User, UserRole } from '@org/models';
import { Observable, of, throwError } from 'rxjs';
import { MOCK_CURRENT_USER } from '../auth/auth.service';

export type UserDraft = Omit<User, 'id'>;

export type UserChanges = Partial<UserDraft>;

export const SEED_USERS: User[] = [
  MOCK_CURRENT_USER,
  {
    id: 'mock-user-2',
    displayName: 'Mock Member',
    contact: [{ method: ContactMethod.Signal, value: '555-0101' }],
    roles: [UserRole.Member],
  },
  {
    id: 'mock-user-3',
    displayName: 'Mock Prospect',
    contact: [{ method: ContactMethod.WhatsApp, value: '555-0102' }],
    roles: [UserRole.Prospect],
  },
];

export function userNotFoundMessage(id: string): string {
  return `User not found: ${id}`;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = new Map<string, User>(
    SEED_USERS.map((user) => [user.id, user]),
  );

  getUsers(): Observable<User[]> {
    return of([...this.users.values()]);
  }

  getUsersByRole(role: UserRole): Observable<User[]> {
    return of(
      [...this.users.values()].filter((user) => user.roles.includes(role)),
    );
  }

  getUserById(id: string): Observable<User | null> {
    return of(this.users.get(id) ?? null);
  }

  createUser(draft: UserDraft): Observable<User> {
    const user: User = { ...draft, id: crypto.randomUUID() };
    this.users.set(user.id, user);
    return of(user);
  }

  updateUser(id: string, changes: UserChanges): Observable<User> {
    const existing = this.users.get(id);
    if (!existing) {
      return throwError(() => new Error(userNotFoundMessage(id)));
    }

    const updated: User = { ...existing, ...changes, id };
    this.users.set(id, updated);
    return of(updated);
  }

  deleteUser(id: string): Observable<void> {
    if (!this.users.delete(id)) {
      return throwError(() => new Error(userNotFoundMessage(id)));
    }
    return of(undefined);
  }
}
