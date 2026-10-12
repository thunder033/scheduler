import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HEADER_TITLE, Header } from './header';
import { HeaderHarness } from './header.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [Header],
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
});
