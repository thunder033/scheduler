import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import {
  DEFAULT_THEME_PREFERENCE,
  LocalUserState,
} from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import {
  THEME_LABELS,
  THEME_OPTIONS,
  ThemeMenuComponent,
} from './theme-menu.component';
import { ThemeMenuHarness } from './theme-menu.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [ThemeMenuComponent],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(ThemeMenuComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    ThemeMenuHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('ThemeMenuComponent', () => {
  it('should offer every theme option', async () => {
    const { harness } = await setup();

    expect(await harness.getThemes()).toEqual(
      THEME_OPTIONS.map((option) => option.label),
    );
  });

  it('should show the current theme preference', async () => {
    const { harness } = await setup();

    expect(await harness.getSelectedTheme()).toBe(
      THEME_LABELS[DEFAULT_THEME_PREFERENCE],
    );
  });

  it.each(THEME_OPTIONS)(
    'should apply the $label theme when selected',
    async ({ value, label }) => {
      const { harness, store } = await setup();

      await harness.selectTheme(label);

      expect(await harness.getSelectedTheme()).toBe(label);
      expect(store.selectSnapshot(LocalUserState.themePreference)).toBe(value);
    },
  );
});
