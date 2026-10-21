import { formatDate } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { AvailabilityStatus, User, UserRole } from '@org/models';
import {
  AppointmentWeek,
  SEED_USERS,
  TimeslotDraft,
  TimeslotService,
} from '@org/scheduler-ui/data';
import {
  PlanningState,
  SetCurrentUser,
  UsersState,
} from '@org/scheduler-ui/state';
import { provideTestState } from '@org/scheduler-ui/test-utils';
import {
  addWeeks,
  getISOWeek,
  getISOWeekYear,
  isSameDay,
  subWeeks,
} from 'date-fns';
import { firstValueFrom } from 'rxjs';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';
import {
  AppointmentsComponent,
  DAY_DATE_FORMAT,
  DAY_NAME_FORMAT,
  weekDays,
  weekTitle,
} from './appointments.component';
import { AppointmentsHarness } from './appointments.harness';

const LOCALE = 'en-US';
/** A Monday in a year long past, whose weeks have none of the appointments seeded around today */
const DEFAULT_TODAY = new Date(2001, 9, 15);
/** Week 53 of 2004, which is followed by the first week of 2005 */
const LAST_WEEK_OF_YEAR = new Date(2004, 11, 27);

/** A day of the week none of the seeded timeslots use */
const UNSEEDED_DAY = 2;

function createTimeslotDraft(
  overrides: Partial<TimeslotDraft> = {},
): TimeslotDraft {
  return {
    start: '13:00',
    end: '14:00',
    dayOfWeek: UNSEEDED_DAY,
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

function toWeek(date: Date): AppointmentWeek {
  return { year: getISOWeekYear(date), week: getISOWeek(date) };
}

interface SetupOptions {
  today?: Date;
  /** Timeslots created in addition to the seeded ones */
  drafts?: TimeslotDraft[];
  /** Weeks that already have an appointment, for the first of the timeslots */
  appointmentWeeks?: AppointmentWeek[];
}

async function setup({
  today = DEFAULT_TODAY,
  drafts = [],
  appointmentWeeks = [],
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [AppointmentsComponent],
    providers: [provideTestState()],
  }).compileComponents();

  // The service seeds appointments around the time it is created, which is the real time here
  const timeslotService = TestBed.inject(TimeslotService);
  vi.setSystemTime(today);
  for (const draft of drafts) {
    await firstValueFrom(timeslotService.createTimeslot(draft));
  }
  const [timeslot] = await firstValueFrom(timeslotService.getTimeslots());
  for (const week of appointmentWeeks) {
    await firstValueFrom(
      timeslotService.createAppointment(timeslot.timeslotId, week),
    );
  }

  const fixture = TestBed.createComponent(AppointmentsComponent);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AppointmentsHarness,
  );

  return {
    fixture,
    harness,
    today,
    /** The timeslot the appointments are created for */
    timeslot,
    /** Signs the user in, who the availability is for */
    signIn: (user: User) =>
      firstValueFrom(TestBed.inject(Store).dispatch(new SetCurrentUser(user))),
    getServiceTimeslots: () => firstValueFrom(timeslotService.getTimeslots()),
    getLoadedAppointments: (week: AppointmentWeek) =>
      TestBed.inject(Store).selectSnapshot(
        PlanningState.appointmentsByWeek(week),
      ),
  };
}

describe('AppointmentsComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('should title the calendar with the current week and year', async () => {
    const { harness, today } = await setup();

    expect(await harness.getWeekTitle()).toBe(weekTitle(today));
  });

  it('should show all seven days of the week with their name and date', async () => {
    const { harness, today } = await setup();

    expect(await harness.getDayHeadings()).toEqual(
      weekDays(today).map((day) => ({
        name: formatDate(day, DAY_NAME_FORMAT, LOCALE),
        date: formatDate(day, DAY_DATE_FORMAT, LOCALE),
        isToday: isSameDay(day, today),
      })),
    );
  });

  it('should highlight only the current day', async () => {
    const { harness, today } = await setup();

    const highlighted = (await harness.getDayHeadings()).filter(
      ({ isToday }) => isToday,
    );

    expect(highlighted.map(({ date }) => date)).toEqual([
      formatDate(today, DAY_DATE_FORMAT, LOCALE),
    ]);
  });

  it('should not highlight any day in another week', async () => {
    const { harness } = await setup();

    await harness.nextWeek();

    expect(
      (await harness.getDayHeadings()).some(({ isToday }) => isToday),
    ).toBe(false);
  });

  it('should highlight the current day again after returning to its week', async () => {
    const { harness } = await setup();

    await harness.previousWeek();
    await harness.nextWeek();

    expect(
      (await harness.getDayHeadings()).filter(({ isToday }) => isToday),
    ).toHaveLength(1);
  });

  it('should show the next week after navigating forward', async () => {
    const { harness, today } = await setup();

    await harness.nextWeek();

    expect(await harness.getWeekTitle()).toBe(weekTitle(addWeeks(today, 1)));
  });

  it('should show the previous week after navigating back', async () => {
    const { harness, today } = await setup();

    await harness.previousWeek();

    expect(await harness.getWeekTitle()).toBe(weekTitle(subWeeks(today, 1)));
  });

  it('should show the days of the new week after navigating', async () => {
    const { harness, today } = await setup();
    const headingsBefore = await harness.getDayHeadings();

    await harness.nextWeek();

    const headings = await harness.getDayHeadings();
    expect(headings).toHaveLength(headingsBefore.length);
    expect(headings[0].date).toBe(
      formatDate(weekDays(addWeeks(today, 1))[0], DAY_DATE_FORMAT, LOCALE),
    );
    expect(headings[0].date).not.toBe(headingsBefore[0].date);
  });

  it('should continue into the next year after the last week of the year', async () => {
    const { harness, today } = await setup({ today: LAST_WEEK_OF_YEAR });

    await harness.nextWeek();

    const next = addWeeks(today, 1);
    expect(getISOWeekYear(next)).toBe(getISOWeekYear(today) + 1);
    expect(await harness.getWeekTitle()).toBe(weekTitle(next));
  });

  it('should list an open timeslot under the day of the week of each timeslot', async () => {
    const { harness, getServiceTimeslots } = await setup({
      drafts: [createTimeslotDraft()],
    });

    const timeRangesByDay = await harness.getTimeRangesByDay();

    for (const timeslot of await getServiceTimeslots()) {
      expect(timeRangesByDay[timeslot.dayOfWeek - 1]).toContain(
        formatTimeRange(timeslot),
      );
    }
  });

  it('should list no open timeslots under days without timeslots', async () => {
    const { harness, getServiceTimeslots } = await setup();
    const timeslotDays = new Set(
      (await getServiceTimeslots()).map(({ dayOfWeek }) => dayOfWeek),
    );

    const timeRangesByDay = await harness.getTimeRangesByDay();

    timeRangesByDay.forEach((timeRanges, index) => {
      if (!timeslotDays.has(index + 1)) {
        expect(timeRanges).toEqual([]);
      }
    });
  });

  it('should list the open timeslots of a day in order of their start', async () => {
    const early = createTimeslotDraft({ start: '08:00', end: '09:00' });
    const late = createTimeslotDraft({ start: '15:00', end: '16:00' });
    const { harness } = await setup({ drafts: [late, early] });

    const timeRangesByDay = await harness.getTimeRangesByDay();

    expect(timeRangesByDay[UNSEEDED_DAY - 1]).toEqual([
      formatTimeRange(early),
      formatTimeRange(late),
    ]);
  });

  describe('timeslots that are over', () => {
    /** A Tuesday at noon, with timeslots before and after it */
    const TUESDAY_NOON = new Date(2001, 9, 16, 12);

    it('should not list an open timeslot that has ended', async () => {
      const ended = createTimeslotDraft({ start: '08:00', end: '09:00' });
      const upcoming = createTimeslotDraft({ start: '15:00', end: '16:00' });
      const { harness } = await setup({
        today: TUESDAY_NOON,
        drafts: [ended, upcoming],
      });

      const timeRangesByDay = await harness.getTimeRangesByDay();

      expect(timeRangesByDay[UNSEEDED_DAY - 1]).toEqual([
        formatTimeRange(upcoming),
      ]);
    });

    it('should not list an open timeslot of an earlier day of the week', async () => {
      const { harness } = await setup({ today: TUESDAY_NOON });

      const [monday] = await harness.getTimeRangesByDay();

      expect(monday).toEqual([]);
    });

    it('should not list the open timeslots of a past week', async () => {
      const { harness } = await setup({ today: TUESDAY_NOON });

      await harness.previousWeek();

      expect(
        (await harness.getTimeRangesByDay()).every(
          (timeRanges) => timeRanges.length === 0,
        ),
      ).toBe(true);
    });

    it('should still show the appointment of a timeslot that has ended', async () => {
      const { harness, timeslot } = await setup({
        today: TUESDAY_NOON,
        appointmentWeeks: [toWeek(TUESDAY_NOON)],
      });
      expect(timeslot.dayOfWeek).toBeLessThan(UNSEEDED_DAY);

      const day = (await harness.getDays())[timeslot.dayOfWeek - 1];

      expect(await day.getAppointmentTimeRanges()).toEqual([
        formatTimeRange(timeslot),
      ]);
    });
  });

  it('should list the same open timeslots in every week', async () => {
    const { harness } = await setup({ drafts: [createTimeslotDraft()] });
    const timeRangesByDay = await harness.getTimeRangesByDay();

    await harness.nextWeek();

    expect(await harness.getTimeRangesByDay()).toEqual(timeRangesByDay);
  });

  it('should load the appointments of the week being viewed', async () => {
    const week = toWeek(DEFAULT_TODAY);
    const nextWeek = toWeek(addWeeks(DEFAULT_TODAY, 1));
    const { harness, getLoadedAppointments } = await setup({
      appointmentWeeks: [week, nextWeek],
    });

    await harness.getWeekTitle();
    expect(getLoadedAppointments(week)).toHaveLength(1);
    expect(getLoadedAppointments(nextWeek)).toEqual([]);

    await harness.nextWeek();

    expect(getLoadedAppointments(nextWeek)).toHaveLength(1);
  });

  it('should show an appointment instead of an open timeslot where the timeslot has one', async () => {
    const { harness, timeslot } = await setup({
      appointmentWeeks: [toWeek(DEFAULT_TODAY)],
    });

    const day = (await harness.getDays())[timeslot.dayOfWeek - 1];

    expect(await day.getAppointmentTimeRanges()).toEqual([
      formatTimeRange(timeslot),
    ]);
    expect(await day.getTimeRanges()).not.toContain(formatTimeRange(timeslot));
  });

  it('should show an open timeslot in a week where the timeslot has no appointment', async () => {
    const { harness, timeslot } = await setup({
      appointmentWeeks: [toWeek(DEFAULT_TODAY)],
    });

    await harness.nextWeek();

    const day = (await harness.getDays())[timeslot.dayOfWeek - 1];
    expect(await day.getTimeRanges()).toContain(formatTimeRange(timeslot));
    expect(await day.getAppointmentTimeRanges()).toEqual([]);
  });

  it('should show the appointment with the availability of the user once they add it', async () => {
    const { harness, timeslot, signIn } = await setup();
    await signIn(createUser());
    const day = (await harness.getDays())[timeslot.dayOfWeek - 1];
    const [openCard] = await day.getOpenTimeslotCards({
      timeRange: formatTimeRange(timeslot),
    });
    await openCard.startAddingAvailability();
    const select = await openCard.availabilitySelect();
    assert(select, 'The availability options should be shown');
    await select.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
    );

    await openCard.saveAvailability();

    expect(await day.getTimeRanges()).not.toContain(formatTimeRange(timeslot));
    const [appointmentCard] = await day.getAppointmentCards({
      timeRange: formatTimeRange(timeslot),
    });
    const availability = await appointmentCard.availabilitySelect();
    assert(availability, 'The appointment card has no availability select');
    expect(await availability.getSelectedStatus()).toBe(
      AvailabilityStatus.IfNeeded,
    );
  });

  it('should load the users, to name the participants whose availability is shown', async () => {
    const { harness } = await setup();

    await harness.getWeekTitle();

    expect(
      Object.keys(TestBed.inject(Store).selectSnapshot(UsersState.usersById)),
    ).toEqual(SEED_USERS.map(({ id }) => id));
  });

  it('should save a status chosen on the appointment, and show it on the appointment', async () => {
    const { harness, timeslot, signIn, getLoadedAppointments } = await setup();
    const week = toWeek(DEFAULT_TODAY);
    const user = createUser();
    await signIn(user);
    const day = (await harness.getDays())[timeslot.dayOfWeek - 1];
    const [openCard] = await day.getOpenTimeslotCards({
      timeRange: formatTimeRange(timeslot),
    });
    await openCard.startAddingAvailability();
    await openCard.saveAvailability();
    const [appointmentCard] = await day.getAppointmentCards({
      timeRange: formatTimeRange(timeslot),
    });
    const availability = await appointmentCard.availabilitySelect();
    assert(availability, 'The appointment card has no availability select');

    await availability.selectOption(
      AVAILABILITY_STATUS_LABELS[AvailabilityStatus.Unavailable],
    );

    expect(await availability.getSelectedStatus()).toBe(
      AvailabilityStatus.Unavailable,
    );
    expect(
      getLoadedAppointments(week).flatMap(({ availabilities }) =>
        availabilities.filter(({ participantId }) => participantId === user.id),
      ),
    ).toEqual([
      { participantId: user.id, status: AvailabilityStatus.Unavailable },
    ]);
  });

  it('should return to the same week after navigating forward and back', async () => {
    const { harness, today } = await setup();

    await harness.nextWeek();
    await harness.previousWeek();

    expect(await harness.getWeekTitle()).toBe(weekTitle(today));
  });
});
