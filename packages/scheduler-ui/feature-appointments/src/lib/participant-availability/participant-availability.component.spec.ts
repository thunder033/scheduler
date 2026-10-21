import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AvailabilityStatus } from '@org/models';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import {
  CONFIRMED_LABEL,
  ParticipantAvailabilityComponent,
} from './participant-availability.component';
import { ParticipantAvailabilityHarness } from './participant-availability.harness';

const STATUSES = Object.values(AvailabilityStatus);

interface SetupOptions {
  name?: string;
  status?: AvailabilityStatus;
  confirmed?: boolean;
  confirmable?: boolean;
}

async function setup({
  name = 'Member One',
  status = AvailabilityStatus.Available,
  confirmed = false,
  confirmable = false,
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [ParticipantAvailabilityComponent],
  }).compileComponents();

  const fixture = TestBed.createComponent(ParticipantAvailabilityComponent);
  fixture.componentRef.setInput('name', name);
  fixture.componentRef.setInput('status', status);
  fixture.componentRef.setInput('confirmed', confirmed);
  fixture.componentRef.setInput('confirmable', confirmable);
  const changes: boolean[] = [];
  fixture.componentInstance.confirmationChange.subscribe((change) =>
    changes.push(change),
  );
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    ParticipantAvailabilityHarness,
  );

  return { fixture, harness, name, changes };
}

describe('ParticipantAvailabilityComponent', () => {
  it('shows the name of the participant', async () => {
    const { harness, name } = await setup();

    expect(await harness.getName()).toBe(name);
  });

  it.each(STATUSES)('shows the dot of the %s status', async (status) => {
    const { harness } = await setup({ status });

    expect(await harness.getStatus()).toBe(status);
  });

  it.each(STATUSES)(
    'explains the dot of the %s status in a tooltip',
    async (status) => {
      const { harness } = await setup({ status });

      expect(await harness.getStatusTooltip()).toBe(
        AVAILABILITY_STATUS_LABELS[status],
      );
    },
  );

  it('explains the mark of a confirmed participant in a tooltip', async () => {
    const { harness } = await setup({ confirmed: true });

    expect(await harness.getConfirmedTooltip()).toBe(CONFIRMED_LABEL);
  });

  it('has no mark to explain for a participant who is not confirmed', async () => {
    const { harness } = await setup();

    expect(await harness.getConfirmedTooltip()).toBeNull();
  });

  it('shows the new name and status when they change', async () => {
    const { fixture, harness } = await setup();

    fixture.componentRef.setInput('name', 'Member Two');
    fixture.componentRef.setInput('status', AvailabilityStatus.IfNeeded);

    expect(await harness.getName()).toBe('Member Two');
    expect(await harness.getStatus()).toBe(AvailabilityStatus.IfNeeded);
  });

  describe('confirmation', () => {
    it('shows a confirmed participant as confirmed, with no way to change it', async () => {
      const { harness } = await setup({ confirmed: true });

      expect(await harness.isConfirmed()).toBe(true);
      expect(await harness.hasConfirmControl()).toBe(false);
    });

    it('does not show a participant who is not confirmed as confirmed', async () => {
      const { harness } = await setup();

      expect(await harness.isConfirmed()).toBe(false);
    });

    it('offers to confirm a participant who can be confirmed', async () => {
      const { harness } = await setup({ confirmable: true });

      expect(await harness.hasConfirmControl()).toBe(true);
      expect(await harness.isConfirmed()).toBe(false);
    });

    it('shows a participant who can be confirmed as confirmed when they are', async () => {
      const { harness } = await setup({ confirmable: true, confirmed: true });

      expect(await harness.isConfirmed()).toBe(true);
    });

    it('reports the confirmation that is chosen', async () => {
      const { harness, changes } = await setup({ confirmable: true });

      await harness.toggleConfirmed();
      await harness.toggleConfirmed();

      expect(changes).toEqual([true, false]);
    });
  });
});
