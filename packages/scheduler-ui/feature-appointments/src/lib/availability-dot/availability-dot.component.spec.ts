import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AvailabilityStatus } from '@org/models';
import {
  AVAILABILITY_STATUS_COLOR_CLASSES,
  AvailabilityDotComponent,
} from './availability-dot.component';
import { AvailabilityDotHarness } from './availability-dot.harness';

const STATUSES = Object.values(AvailabilityStatus);

async function setup({
  status = AvailabilityStatus.Available,
}: { status?: AvailabilityStatus } = {}) {
  await TestBed.configureTestingModule({
    imports: [AvailabilityDotComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(AvailabilityDotComponent);
  fixture.componentRef.setInput('status', status);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AvailabilityDotHarness,
  );

  return { fixture, harness };
}

describe('AvailabilityDotComponent', () => {
  it('should stand for the status it is given', async () => {
    const { harness } = await setup({ status: AvailabilityStatus.IfNeeded });

    expect(await harness.getStatus()).toBe(AvailabilityStatus.IfNeeded);
  });

  it.each(STATUSES)(
    'should be in the color of the %s status',
    async (status) => {
      const { harness } = await setup({ status });

      expect(
        await harness.hasColorClass(AVAILABILITY_STATUS_COLOR_CLASSES[status]),
      ).toBe(true);
    },
  );

  it('should change color when the status changes', async () => {
    const { fixture, harness } = await setup({
      status: AvailabilityStatus.Available,
    });

    fixture.componentRef.setInput('status', AvailabilityStatus.IfNeeded);

    expect(
      await harness.hasColorClass(
        AVAILABILITY_STATUS_COLOR_CLASSES[AvailabilityStatus.IfNeeded],
      ),
    ).toBe(true);
    expect(
      await harness.hasColorClass(
        AVAILABILITY_STATUS_COLOR_CLASSES[AvailabilityStatus.Available],
      ),
    ).toBe(false);
  });

  it('should give every status its own color', () => {
    const colors = STATUSES.map(
      (status) => AVAILABILITY_STATUS_COLOR_CLASSES[status],
    );

    expect(new Set(colors).size).toBe(STATUSES.length);
  });
});
