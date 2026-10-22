import { Injectable, inject } from '@angular/core';
import { User, UserRole } from '@scheduler/models';
import { Observable, of, throwError } from 'rxjs';
import { SEED_USERS } from '../seed/seed.tokens';

export type UserDraft = Omit<User, 'id'>;

export type UserChanges = Partial<UserDraft>;

export function userNotFoundMessage(id: string): string {
  return `User not found: ${id}`;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users = new Map<string, User>(
    inject(SEED_USERS).map((user) => [user.id, user]),
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
