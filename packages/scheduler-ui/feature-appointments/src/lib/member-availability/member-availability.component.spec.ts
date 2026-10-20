import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AvailabilityStatus } from '@org/models';
import { MemberAvailabilityComponent } from './member-availability.component';
import { MemberAvailabilityHarness } from './member-availability.harness';

const STATUSES = Object.values(AvailabilityStatus);

async function setup({
  name = 'Member One',
  status = AvailabilityStatus.Available,
}: { name?: string; status?: AvailabilityStatus } = {}) {
  await TestBed.configureTestingModule({
    imports: [MemberAvailabilityComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(MemberAvailabilityComponent);
  fixture.componentRef.setInput('name', name);
  fixture.componentRef.setInput('status', status);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    MemberAvailabilityHarness,
  );

  return { fixture, harness, name };
}

describe('MemberAvailabilityComponent', () => {
  it('should show the name of the member', async () => {
    const { harness, name } = await setup();

    expect(await harness.getName()).toBe(name);
  });

  it.each(STATUSES)('should show the dot of the %s status', async (status) => {
    const { harness } = await setup({ status });

    expect(await harness.getStatus()).toBe(status);
  });

  it('should show the new name and status when they change', async () => {
    const { fixture, harness } = await setup();

    fixture.componentRef.setInput('name', 'Member Two');
    fixture.componentRef.setInput('status', AvailabilityStatus.IfNeeded);

    expect(await harness.getName()).toBe('Member Two');
    expect(await harness.getStatus()).toBe(AvailabilityStatus.IfNeeded);
  });
});
