import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Store } from '@ngxs/store';
import { User } from '@scheduler/models';
import { mockUser } from '@scheduler/ui/data/testing';
import { provideSchedulerUiState, SetCurrentUser } from '@scheduler/ui/state';
import { provideTestSeeds } from '@scheduler/ui/test-utils';
import { LOGIN_PATH } from './app.paths';
import { authGuard } from './auth.guard';

const PROTECTED_PATH = 'protected';

@Component({ template: '' })
class TestPage {}

async function setup(currentUser: User | null) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: LOGIN_PATH, component: TestPage },
        { path: PROTECTED_PATH, component: TestPage, canActivate: [authGuard] },
      ]),
      provideSchedulerUiState(),
      provideTestSeeds(),
    ],
  });
  TestBed.inject(Store).dispatch(new SetCurrentUser(currentUser));

  const routerHarness = await RouterTestingHarness.create();

  return { routerHarness, router: TestBed.inject(Router) };
}

describe('authGuard', () => {
  it('allows navigation when there is a current user', async () => {
    const { routerHarness, router } = await setup(mockUser.MEMBER);

    await routerHarness.navigateByUrl(`/${PROTECTED_PATH}`);

    expect(router.url).toBe(`/${PROTECTED_PATH}`);
  });

  it('redirects to the login page when there is no current user', async () => {
    const { routerHarness, router } = await setup(null);

    await routerHarness.navigateByUrl(`/${PROTECTED_PATH}`);

    expect(router.url).toBe(`/${LOGIN_PATH}`);
  });
});
