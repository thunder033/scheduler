import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { User, UserRole } from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '../../test-utils/provide-test-state';
import { THEME_OPTIONS } from '../theme-menu/theme-menu.component';
import { HEADER_TITLE, HeaderComponent } from './header.component';
import { HeaderHarness } from './header.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [HeaderComponent],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(HeaderComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    HeaderHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('HeaderComponent', () => {
  it('should display the application title', async () => {
    const { harness } = await setup();

    expect(await harness.getTitle()).toBe(HEADER_TITLE);
  });

  it('should display the current user', async () => {
    const { harness, store } = await setup();
    const user: User = {
      id: 'user-1',
      displayName: 'Test User',
      contact: [],
      roles: [UserRole.Member],
    };

    store.dispatch(new SetCurrentUser(user));

    const currentUserTile = await harness.currentUserTile();
    expect(await currentUserTile.getDisplayName()).toBe(user.displayName);
  });

  it('should let the user choose a theme', async () => {
    const { harness } = await setup();
    const themeMenu = await harness.themeMenu();
    const { label } = THEME_OPTIONS[0];

    await themeMenu.selectTheme(label);

    expect(await themeMenu.getSelectedTheme()).toBe(label);
  });
});
