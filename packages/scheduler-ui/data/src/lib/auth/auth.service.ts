import { Injectable, inject } from '@angular/core';
import { User } from '@org/models';
import { Observable, of } from 'rxjs';
import { SEED_CURRENT_USER } from '../seed/seed.tokens';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUser = inject(SEED_CURRENT_USER);

  getCurrentUser(): Observable<User | null> {
    return of(this.currentUser);
  }
}
