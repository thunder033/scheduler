import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import {
  Appointment,
  Availability,
  AvailabilityStatus,
  Timeslot,
  User,
  UserRole,
} from '@org/models';
import { SetCurrentUser } from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import { firstValueFrom } from 'rxjs';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';
import { AppointmentCardComponent } from './appointment-card.component';
import { AppointmentCardHarness } from './appointment-card.harness';

function createTimeslot(overrides: Partial<Timeslot> = {}): Timeslot {
  return {
    timeslotId: 'timeslot-1',
    start: '09:00',
    end: '10:30',
    dayOfWeek: 1,
    ...overrides,
  };
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'member-1',
    displayName: 'Member One',
    contact: [],
    roles: [UserRole.Member],
    ...overrides,
  };
}

function createAvailability(
  overrides: Partial<Availability> = {},
): Availability {
  return {
    memberId: 'member-1',
    status: AvailabilityStatus.Available,
    ...overrides,
  };
}

function createAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    appointmentId: 'appointment-1',
    timeslotId: 'timeslot-1',
    year: 2026,
    week: 43,
    availabilities: [],
    confirmedUserIds: [],
    ...overrides,
  };
}

interface SetupOptions {
  timeslot?: Timeslot;
  appointment?: Appointment;
  /** The user signed in, whose availability is shown */
  user?: User | null;
}

async function setup({
  timeslot = createTimeslot(),
  appointment = createAppointment(),
  user = createUser(),
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [AppointmentCardComponent],
    providers: [provideTestState()],
  }).compileComponents();

  if (user) {
    await firstValueFrom(
      TestBed.inject(Store).dispatch(new SetCurrentUser(user)),
    );
  }

  const fixture = TestBed.createComponent(AppointmentCardComponent);
  fixture.componentRef.setInput('timeslot', timeslot);
  fixture.componentRef.setInput('appointment', appointment);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AppointmentCardHarness,
  );

  return { fixture, harness, timeslot, user };
}

describe('AppointmentCardComponent', () => {
  it('should display the time range of the timeslot', async () => {
    const { harness, timeslot } = await setup();

    expect(await harness.getTimeRange()).toBe(formatTimeRange(timeslot));
  });

  it('should not show an availability when the user has not set one', async () => {
    const { harness } = await setup({
      appointment: createAppointment({
        availabilities: [createAvailability({ memberId: 'other-member' })],
      }),
    });

    expect(await harness.hasAvailability()).toBe(false);
  });

  it.each(Object.values(AvailabilityStatus))(
    'should show the %s availability the user has set, with its color',
    async (status) => {
      const { harness } = await setup({
        appointment: createAppointment({
          availabilities: [
            createAvailability({ memberId: 'other-member' }),
            createAvailability({ status }),
          ],
        }),
      });
      const availability = await harness.availabilityStatus();
      assert(availability, 'The availability should be shown');

      expect(await availability.getLabel()).toBe(
        AVAILABILITY_STATUS_LABELS[status],
      );
      expect(await availability.getStatus()).toBe(status);
    },
  );

  it('should show the availability once the user sets it', async () => {
    const { fixture, harness } = await setup();
    expect(await harness.hasAvailability()).toBe(false);

    fixture.componentRef.setInput(
      'appointment',
      createAppointment({ availabilities: [createAvailability()] }),
    );

    expect(await harness.hasAvailability()).toBe(true);
  });

  it('should not show an availability without a user', async () => {
    const { harness } = await setup({
      user: null,
      appointment: createAppointment({ availabilities: [createAvailability()] }),
    });

    expect(await harness.hasAvailability()).toBe(false);
  });
});
