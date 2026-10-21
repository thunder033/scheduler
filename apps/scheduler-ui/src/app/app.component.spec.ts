import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideRouter } from '@angular/router';
import { Store } from '@ngxs/store';
import {
  THEME_COLOR_SCHEME_BY_PREFERENCE,
  provideSchedulerUiState,
  SetThemePreference,
  THEME_PREFERENCES,
} from '@org/scheduler-ui/state';
import { provideTestSeeds } from '@org/scheduler-ui/test-utils';
import { AppComponent } from './app.component';
import { AppHarness } from './app.harness';

async function setup() {
  localStorage.clear();
  await TestBed.configureTestingModule({
    imports: [AppComponent],
    providers: [
      provideRouter([]),
      provideSchedulerUiState(),
      provideTestSeeds(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AppComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AppHarness,
  );

  return { fixture, harness, store: TestBed.inject(Store) };
}

describe('AppComponent', () => {
  it.each(THEME_PREFERENCES)(
    'applies the color scheme for the %s theme preference',
    async (preference) => {
      const { harness, store } = await setup();

      store.dispatch(new SetThemePreference(preference));

      expect(await harness.getColorScheme()).toBe(
        THEME_COLOR_SCHEME_BY_PREFERENCE[preference],
      );
    },
  );
});
