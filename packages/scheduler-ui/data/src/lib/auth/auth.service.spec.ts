import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService, MOCK_CURRENT_USER } from './auth.service';

function setup() {
  return { service: TestBed.inject(AuthService) };
}

describe('AuthService', () => {
  describe('getCurrentUser', () => {
    it('should emit the mocked current user', async () => {
      const { service } = setup();

      const user = await firstValueFrom(service.getCurrentUser());

      expect(user).toEqual(MOCK_CURRENT_USER);
    });
  });
});
