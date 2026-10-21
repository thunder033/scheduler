import { TestBed } from '@angular/core/testing';
import { User } from '@org/models';
import { firstValueFrom } from 'rxjs';
import { SEED_CURRENT_USER } from '../seed/seed.tokens';
import { mockUser } from '../testing/mock-user';
import { AuthService } from './auth.service';

function setup(currentUser: User | null = mockUser.COORDINATOR) {
  TestBed.configureTestingModule({
    providers: [{ provide: SEED_CURRENT_USER, useValue: currentUser }],
  });
  return { service: TestBed.inject(AuthService), currentUser };
}

describe('AuthService', () => {
  describe('getCurrentUser', () => {
    it('emits the seeded current user', async () => {
      const { service, currentUser } = setup(mockUser.MEMBER);

      expect(await firstValueFrom(service.getCurrentUser())).toEqual(
        currentUser,
      );
    });

    it('emits null when no user is seeded', async () => {
      const { service } = setup(null);

      expect(await firstValueFrom(service.getCurrentUser())).toBeNull();
    });
  });
});
