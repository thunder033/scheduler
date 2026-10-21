import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Availability, AvailabilityStatus, User, UserRole } from '@org/models';
import { AppointmentWeek, TimeslotService } from '@org/scheduler-ui/data';
import {
  CreateAppointment,
  PlanningState,
  SetAvailability,
  SetCurrentUser,
} from '@org/scheduler-ui/state';
import {
  mockTimeslot,
  mockTimeslotDraft,
  mockUser,
} from '@org/scheduler-ui/data/testing';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import { firstValueFrom } from 'rxjs';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import {
  formatTimeRange,
  OpenTimeslotCardComponent,
} from './open-timeslot-card.component';
import { OpenTimeslotCardHarness } from './open-timeslot-card.harness';

/** A year long past, so its weeks have no appointments unless a test creates them */
const PAST_YEAR = 2001;
const AVAILABILITY_SELECT_MESSAGE = 'The availability options should be shown';

function createWeek(overrides: Partial<AppointmentWeek> = {}): AppointmentWeek {
  return { year: PAST_YEAR, week: 43, ...overrides };
}

function createAvailability(
  overrides: Partial<Availability> = {},
): Availability {
  return {
    participantId: 'other-member',
    status: AvailabilityStatus.Available,
    ...overrides,
  };
}

interface SetupOptions {
  week?: AppointmentWeek;
  /** The user signed in, who the availability is for */
  user?: User | null;
}

async function setup({
  week = createWeek(),
  user = mockUser.MEMBER,
}: SetupOptions = {}) {
  const timeslot = mockTimeslot.MONDAY_MORNING;
  await TestBed.configureTestingModule({
    imports: [OpenTimeslotCardComponent],
    providers: [provideTestState({ timeslots: [timeslot] })],
  }).compileComponents();

  const store = TestBed.inject(Store);
  if (user) {
    await firstValueFrom(store.dispatch(new SetCurrentUser(user)));
  }

  const fixture = TestBed.createComponent(OpenTimeslotCardComponent);
  fixture.componentRef.setInput('timeslot', timeslot);
  fixture.componentRef.setInput('week', week);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    OpenTimeslotCardHarness,
  );

  return {
    fixture,
    harness,
    timeslot,
    week,
    user,
    getAppointments: (forWeek = week) =>
      store.selectSnapshot(PlanningState.appointmentsByWeek(forWeek)),
    /** Creates an appointment for the timeslot in the week, with the availabilities */
    createAppointment: async (
      forWeek = week,
      availabilities: Availability[] = [],
    ) => {
      await firstValueFrom(
        store.dispatch(new CreateAppointment(timeslot.timeslotId, forWeek)),
      );
      const [appointment] = store.selectSnapshot(
        PlanningState.appointmentsByWeek(forWeek),
      );
      for (const availability of availabilities) {
        await firstValueFrom(
          store.dispatch(
            new SetAvailability(appointment.appointmentId, availability),
          ),
        );
      }
    },
  };
}

describe('OpenTimeslotCardComponent', () => {
  it('should display the time range of the timeslot', async () => {
    const { harness, timeslot } = await setup();

    expect(await harness.getTimeRange()).toBe(formatTimeRange(timeslot));
  });

  it('should display the new time range when the timeslot changes', async () => {
    const { fixture, harness } = await setup();
    const changed = mockTimeslot({
      start: '14:00',
      end: '15:00',
      dayOfWeek: 2,
    });

    fixture.componentRef.setInput('timeslot', changed);

    expect(await harness.getTimeRange()).toBe(formatTimeRange(changed));
  });

  it('should offer adding availability before it is started', async () => {
    const { harness } = await setup();

    expect(await harness.hasAddAvailability()).toBe(true);
    expect(await harness.isAddingAvailability()).toBe(false);
  });

  it('should replace the control to add availability with the options when started', async () => {
    const { harness } = await setup();

    await harness.startAddingAvailability();

    expect(await harness.isAddingAvailability()).toBe(true);
    expect(await harness.hasAddAvailability()).toBe(false);
  });

  it('should bring back the control to add availability after saving', async () => {
    const { harness } = await setup();
    await harness.startAddingAvailability();

    await harness.saveAvailability();

    expect(await harness.hasAddAvailability()).toBe(true);
  });

  it('should create the appointment for the timeslot in the week when there is none', async () => {
    const { harness, timeslot, week, user, getAppointments } = await setup();
    await harness.startAddingAvailability();
    const select = await harness.availabilitySelect();
    assert(select, AVAILABILITY_SELECT_MESSAGE);
    await select.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
    );

    await harness.saveAvailability();

    expect(getAppointments()).toEqual([
      expect.objectContaining({
        timeslotId: timeslot.timeslotId,
        year: week.year,
        week: week.week,
        availabilities: [
          { participantId: user?.id, status: AvailabilityStatus.IfNeeded },
        ],
      }),
    ]);
  });

  it('should save the availability that was selected first when no other is chosen', async () => {
    const { harness, user, getAppointments } = await setup();
    const [firstStatus] = Object.values(AvailabilityStatus);
    await harness.startAddingAvailability();

    await harness.saveAvailability();

    expect(getAppointments()[0].availabilities).toEqual([
      { participantId: user?.id, status: firstStatus },
    ]);
  });

  it('should add to the appointment of the timeslot in the week when there is one', async () => {
    const other = createAvailability();
    const { harness, user, createAppointment, getAppointments } = await setup();
    await createAppointment(undefined, [other]);
    const [existing] = getAppointments();
    await harness.startAddingAvailability();

    await harness.saveAvailability();

    const appointments = getAppointments();
    expect(appointments).toHaveLength(1);
    expect(appointments[0].appointmentId).toBe(existing.appointmentId);
    expect(appointments[0].availabilities).toEqual(
      expect.arrayContaining([
        other,
        expect.objectContaining({ participantId: user?.id }),
      ]),
    );
    expect(appointments[0].availabilities).toHaveLength(2);
  });

  it('should replace the availability of the user when they save it again', async () => {
    const { harness, getAppointments } = await setup();
    await harness.startAddingAvailability();
    await harness.saveAvailability();
    await harness.startAddingAvailability();
    const select = await harness.availabilitySelect();
    assert(select, AVAILABILITY_SELECT_MESSAGE);
    await select.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
    );

    await harness.saveAvailability();

    const [appointment] = getAppointments();
    expect(getAppointments()).toHaveLength(1);
    expect(appointment.availabilities).toEqual([
      expect.objectContaining({ status: AvailabilityStatus.IfNeeded }),
    ]);
  });

  it('should leave the appointments of other weeks alone', async () => {
    const otherWeek = createWeek({ week: 44 });
    const { harness, createAppointment, getAppointments } = await setup();
    await createAppointment(otherWeek);
    await harness.startAddingAvailability();

    await harness.saveAvailability();

    expect(getAppointments()).toHaveLength(1);
    expect(getAppointments(otherWeek)).toEqual([
      expect.objectContaining({ availabilities: [] }),
    ]);
  });

  it('should not allow saving availability without a user', async () => {
    const { harness, getAppointments } = await setup({ user: null });
    await harness.startAddingAvailability();

    expect(await harness.canSaveAvailability()).toBe(false);
    expect(getAppointments()).toEqual([]);
  });
});
