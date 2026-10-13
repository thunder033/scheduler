import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@org/scheduler-ui/state';
import { LOGIN_PATH } from './app.paths';

export const authGuard: CanActivateFn = () => {
  const currentUser = inject(Store).selectSnapshot(LocalUserState.currentUser);

  return currentUser !== null || inject(Router).createUrlTree([LOGIN_PATH]);
};
