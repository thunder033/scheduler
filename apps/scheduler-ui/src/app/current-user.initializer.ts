import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { AuthService } from '@scheduler/ui/data';
import { SetCurrentUser } from '@scheduler/ui/state';
import { firstValueFrom, switchMap } from 'rxjs';

export function provideCurrentUserInitializer(): EnvironmentProviders {
  return provideAppInitializer(() => {
    const store = inject(Store);
    const authService = inject(AuthService);

    return firstValueFrom(
      authService
        .getCurrentUser()
        .pipe(switchMap((user) => store.dispatch(new SetCurrentUser(user)))),
    );
  });
}
