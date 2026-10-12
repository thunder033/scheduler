import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideTestState } from '../../test-utils/provide-test-state';
import { THEME_OPTIONS } from '../theme-menu/theme-menu';
import { HEADER_TITLE, Header } from './header';
import { HeaderHarness } from './header.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [Header],
    providers: [provideTestState()],
  }).compileComponents();

  const fixture = TestBed.createComponent(Header);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    HeaderHarness,
  );

  return { fixture, harness };
}

describe('Header', () => {
  it('should display the application title', async () => {
    const { harness } = await setup();

    expect(await harness.getTitle()).toBe(HEADER_TITLE);
  });

  it('should let the user choose a theme', async () => {
    const { harness } = await setup();
    const themeMenu = await harness.themeMenu();
    const { label } = THEME_OPTIONS[0];

    await themeMenu.selectTheme(label);

    expect(await themeMenu.getSelectedTheme()).toBe(label);
  });
});
