import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  APPOINTMENTS_TITLE,
  AppointmentsComponent,
} from './appointments.component';
import { AppointmentsHarness } from './appointments.harness';

async function setup() {
  await TestBed.configureTestingModule({
    imports: [AppointmentsComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(AppointmentsComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AppointmentsHarness,
  );

  return { fixture, harness };
}

describe('AppointmentsComponent', () => {
  it('should display the appointments title', async () => {
    const { harness } = await setup();

    expect(await harness.getTitle()).toBe(APPOINTMENTS_TITLE);
  });
});
