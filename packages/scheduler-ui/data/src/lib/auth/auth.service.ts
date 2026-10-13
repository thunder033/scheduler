import { Injectable } from '@angular/core';
import { ContactMethod, User, UserRole } from '@org/models';
import { Observable, of } from 'rxjs';

export const MOCK_CURRENT_USER: User = {
  id: 'mock-user-1',
  displayName: 'Mock Coordinator',
  contact: [{ method: ContactMethod.Phone, value: '555-0100' }],
  roles: [UserRole.Coordinator],
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  getCurrentUser(): Observable<User | null> {
    return of(MOCK_CURRENT_USER);
  }
}
