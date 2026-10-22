import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngxs/store';
import { UserRole } from '@scheduler/models';
import { mockUser } from '@scheduler/ui/data/testing';
import { SetCurrentUser } from '@scheduler/ui/state';
import { provideTestState } from '@scheduler/ui/test-utils';
import { coordinatorGuard, ROOT_URL } from './coordinator.guard';

function setup(roles?: UserRole[]) {
  TestBed.configureTestingModule({ providers: [provideTestState()] });
  const store = TestBed.inject(Store);
  if (roles) {
    store.dispatch(new SetCurrentUser(mockUser({ roles })));
  }

  return {
    router: TestBed.inject(Router),
    canActivate: () =>
      TestBed.runInInjectionContext(() =>
        coordinatorGuard(
          {} as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      ),
  };
}

describe('coordinatorGuard', () => {
  it('allows a coordinator', () => {
    const { canActivate } = setup([UserRole.Coordinator]);

    expect(canActivate()).toBe(true);
  });

  it.each([[[UserRole.Member]], [[UserRole.Prospect]], [undefined]])(
    'sends %s to the root',
    (roles) => {
      const { canActivate, router } = setup(roles);

      const result = canActivate();

      expect(result).toBeInstanceOf(UrlTree);
      expect(router.serializeUrl(result as UrlTree)).toBe(ROOT_URL);
    },
  );
});
