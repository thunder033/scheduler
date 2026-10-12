import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Dashboard } from './dashboard';
import { DashboardHarness } from './dashboard.harness';

interface SetupOptions {
  providers?: Provider[];
}

async function setup({ providers = [] }: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [Dashboard],
    providers,
  }).compileComponents();

  const fixture = TestBed.createComponent(Dashboard);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    DashboardHarness,
  );

  return { fixture, harness };
}

describe('Dashboard', () => {
  it('should render content', async () => {
    const { harness } = await setup();

    expect(await harness.getText()).not.toBe('');
  });
});
