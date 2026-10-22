import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { UserRole } from '@scheduler/models';
import { LocalUserState } from '@scheduler/ui/state';

/** The app's root, which sends the user to the dashboard */
export const ROOT_URL = '/';

export const coordinatorGuard: CanActivateFn = () =>
  inject(Store).selectSnapshot(LocalUserState.hasRole(UserRole.Coordinator)) ||
  inject(Router).parseUrl(ROOT_URL);
