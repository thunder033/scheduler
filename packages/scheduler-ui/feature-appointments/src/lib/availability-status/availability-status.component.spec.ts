import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AvailabilityStatus } from '@org/models';
import {
  AVAILABILITY_STATUS_LABELS,
  AvailabilityStatusComponent,
} from './availability-status.component';
import { AvailabilityStatusHarness } from './availability-status.harness';

const STATUSES = Object.values(AvailabilityStatus);

async function setup({
  status = AvailabilityStatus.Available,
}: { status?: AvailabilityStatus } = {}) {
  await TestBed.configureTestingModule({
    imports: [AvailabilityStatusComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(AvailabilityStatusComponent);
  fixture.componentRef.setInput('status', status);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AvailabilityStatusHarness,
  );

  return { fixture, harness };
}

describe('AvailabilityStatusComponent', () => {
  it.each(STATUSES)(
    'shows the label and the dot of the %s status',
    async (status) => {
      const { harness } = await setup({ status });

      expect(await harness.getLabel()).toBe(AVAILABILITY_STATUS_LABELS[status]);
      expect(await harness.getStatus()).toBe(status);
    },
  );

  it('shows the new status when it changes', async () => {
    const { fixture, harness } = await setup();

    fixture.componentRef.setInput('status', AvailabilityStatus.IfNeeded);

    expect(await harness.getLabel()).toBe(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
    );
    expect(await harness.getStatus()).toBe(AvailabilityStatus.IfNeeded);
  });
});
