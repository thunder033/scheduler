import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Store } from '@ngxs/store';
import { ContactMethod, User, UserRole } from '@org/models';
import {
  provideSchedulerUiState,
  SetCurrentUser,
} from '@org/scheduler-ui/state';
import { LOGIN_PATH } from './app.paths';
import { authGuard } from './auth.guard';

const PROTECTED_PATH = 'protected';

@Component({ template: '' })
class TestPage {}

function createUser(): User {
  return {
    id: 'user-1',
    displayName: 'Test User',
    contact: [{ method: ContactMethod.Phone, value: '555-0100' }],
    roles: [UserRole.Member],
  };
}

async function setup(currentUser: User | null) {
  localStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: LOGIN_PATH, component: TestPage },
        { path: PROTECTED_PATH, component: TestPage, canActivate: [authGuard] },
      ]),
      provideSchedulerUiState(),
    ],
  });
  TestBed.inject(Store).dispatch(new SetCurrentUser(currentUser));

  const routerHarness = await RouterTestingHarness.create();

  return { routerHarness, router: TestBed.inject(Router) };
}

describe('authGuard', () => {
  it('should allow navigation when there is a current user', async () => {
    const { routerHarness, router } = await setup(createUser());

    await routerHarness.navigateByUrl(`/${PROTECTED_PATH}`);

    expect(router.url).toBe(`/${PROTECTED_PATH}`);
  });

  it('should redirect to the login page when there is no current user', async () => {
    const { routerHarness, router } = await setup(null);

    await routerHarness.navigateByUrl(`/${PROTECTED_PATH}`);

    expect(router.url).toBe(`/${LOGIN_PATH}`);
  });
});
