import { TestBed } from '@angular/core/testing';
import { provideStore, Store } from '@ngxs/store';
import { Availability, AvailabilityStatus } from '@org/models';
import {
  appointmentNotFoundMessage,
  AppointmentWeek,
  TimeslotDraft,
  TimeslotService,
  timeslotNotFoundMessage,
} from '@org/scheduler-ui/data';
import { firstValueFrom } from 'rxjs';
import {
  ConfirmParticipant,
  CreateAppointment,
  CreateTimeslot,
  DeleteTimeslot,
  LoadAppointmentsByWeek,
  LoadTimeslots,
  RemoveAvailability,
  RemoveProspect,
  SetAvailability,
  SetProspect,
  StartEditingTimeslot,
  StopEditingTimeslot,
  UpdateEditingTimeslot,
  UnconfirmParticipant,
  UpdateTimeslot,
} from './planning.actions';
import { PlanningState } from './planning.state';

/** A year long past, so its weeks have none of the appointments that are seeded around today */
const PAST_YEAR = 2001;
const MISSING_TIMESLOT_ID = 'missing-timeslot';
const MISSING_APPOINTMENT_ID = 'missing-appointment';

function createTimeslotDraft(
  overrides: Partial<TimeslotDraft> = {},
): TimeslotDraft {
  return {
    start: '13:00',
    end: '14:00',
    dayOfWeek: 2,
    ...overrides,
  };
}

function createWeek(overrides: Partial<AppointmentWeek> = {}): AppointmentWeek {
  return { year: PAST_YEAR, week: 42, ...overrides };
}

function createAvailability(
  overrides: Partial<Availability> = {},
): Availability {
  return {
    participantId: 'member-1',
    status: AvailabilityStatus.Available,
    ...overrides,
  };
}

/** Sets up the store with a timeslot, and optionally an appointment for it in `week` */
async function setup({
  withAppointment = false,
  week = createWeek(),
}: { withAppointment?: boolean; week?: AppointmentWeek } = {}) {
  TestBed.configureTestingModule({
    providers: [provideStore([PlanningState])],
  });
  const store = TestBed.inject(Store);
  const timeslotService = TestBed.inject(TimeslotService);

  await firstValueFrom(
    store.dispatch(new CreateTimeslot(createTimeslotDraft())),
  );
  const timeslot = store.selectSnapshot(PlanningState.timeslots)[0];

  if (withAppointment) {
    await firstValueFrom(
      store.dispatch(new CreateAppointment(timeslot.timeslotId, week)),
    );
  }

  const getAppointments = (forWeek = week) =>
    store.selectSnapshot(PlanningState.appointmentsByWeek(forWeek));

  return {
    store,
    timeslotService,
    timeslot,
    week,
    getAppointments,
    getAppointment: () => getAppointments()[0],
  };
}

describe('PlanningState', () => {
  describe('timeslots', () => {
    it('should select an empty list before anything is loaded or created', () => {
      TestBed.configureTestingModule({
        providers: [provideStore([PlanningState])],
      });

      expect(
        TestBed.inject(Store).selectSnapshot(PlanningState.timeslots),
      ).toEqual([]);
    });
  });

  describe('LoadTimeslots', () => {
    it('should load the timeslots from the service', async () => {
      const { store, timeslotService } = await setup();
      const expected = await firstValueFrom(timeslotService.getTimeslots());

      await firstValueFrom(store.dispatch(new LoadTimeslots()));

      expect(store.selectSnapshot(PlanningState.timeslots)).toEqual(expected);
    });
  });

  describe('CreateTimeslot', () => {
    it('should add the new timeslot', async () => {
      const { store } = await setup();
      const draft = createTimeslotDraft({ start: '08:00', end: '09:00' });

      await firstValueFrom(store.dispatch(new CreateTimeslot(draft)));

      expect(store.selectSnapshot(PlanningState.timeslots)).toContainEqual(
        expect.objectContaining(draft),
      );
    });
  });

  describe('UpdateTimeslot', () => {
    it('should apply the changes to the timeslot', async () => {
      const { store, timeslot } = await setup();
      const changes = { start: '15:00', end: '16:30' };

      await firstValueFrom(
        store.dispatch(new UpdateTimeslot(timeslot.timeslotId, changes)),
      );

      expect(store.selectSnapshot(PlanningState.timeslots)).toEqual([
        { ...timeslot, ...changes },
      ]);
    });

    it('should error when the timeslot does not exist', async () => {
      const { store } = await setup();

      await expect(
        firstValueFrom(
          store.dispatch(new UpdateTimeslot(MISSING_TIMESLOT_ID, {})),
        ),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('DeleteTimeslot', () => {
    it('should remove the timeslot', async () => {
      const { store, timeslot } = await setup();

      await firstValueFrom(
        store.dispatch(new DeleteTimeslot(timeslot.timeslotId)),
      );

      expect(store.selectSnapshot(PlanningState.timeslots)).not.toContainEqual(
        timeslot,
      );
    });

    it('should remove the appointments created from the timeslot but keep others', async () => {
      const { store, timeslot, week, getAppointments } = await setup({
        withAppointment: true,
      });
      await firstValueFrom(
        store.dispatch(new CreateTimeslot(createTimeslotDraft())),
      );
      const other = store
        .selectSnapshot(PlanningState.timeslots)
        .find((candidate) => candidate.timeslotId !== timeslot.timeslotId);
      await firstValueFrom(
        store.dispatch(new CreateAppointment(other?.timeslotId ?? '', week)),
      );

      await firstValueFrom(
        store.dispatch(new DeleteTimeslot(timeslot.timeslotId)),
      );

      expect(getAppointments().map(({ timeslotId }) => timeslotId)).toEqual([
        other?.timeslotId,
      ]);
    });

    it('should error when the timeslot does not exist', async () => {
      const { store } = await setup();

      await expect(
        firstValueFrom(store.dispatch(new DeleteTimeslot(MISSING_TIMESLOT_ID))),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('editing a timeslot', () => {
    it('should not be editing any timeslot by default', async () => {
      const { store } = await setup();

      expect(store.selectSnapshot(PlanningState.editingTimeslot)).toBeNull();
    });

    it('should select the timeslot that started being edited', async () => {
      const { store, timeslot } = await setup();

      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      expect(
        store.selectSnapshot(PlanningState.editingTimeslot)?.timeslotId,
      ).toBe(timeslot.timeslotId);
    });

    it('should only edit one timeslot at a time', async () => {
      const { store, timeslot } = await setup();
      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(MISSING_TIMESLOT_ID)),
      );

      expect(
        store.selectSnapshot(PlanningState.editingTimeslot)?.timeslotId,
      ).toBe(MISSING_TIMESLOT_ID);
    });

    it('should stop editing', async () => {
      const { store, timeslot } = await setup();
      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      await firstValueFrom(store.dispatch(new StopEditingTimeslot()));

      expect(store.selectSnapshot(PlanningState.editingTimeslot)).toBeNull();
    });

    it('should stop editing a timeslot that is deleted', async () => {
      const { store, timeslot } = await setup();
      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      await firstValueFrom(
        store.dispatch(new DeleteTimeslot(timeslot.timeslotId)),
      );

      expect(store.selectSnapshot(PlanningState.editingTimeslot)).toBeNull();
    });

    it('should keep editing a timeslot when another one is deleted', async () => {
      const { store, timeslot } = await setup();
      await firstValueFrom(
        store.dispatch(new CreateTimeslot(createTimeslotDraft())),
      );
      const other = store
        .selectSnapshot(PlanningState.timeslots)
        .find((candidate) => candidate.timeslotId !== timeslot.timeslotId);
      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      await firstValueFrom(
        store.dispatch(new DeleteTimeslot(other?.timeslotId ?? '')),
      );

      expect(
        store.selectSnapshot(PlanningState.editingTimeslot)?.timeslotId,
      ).toBe(timeslot.timeslotId);
    });
  });

  describe('the draft of the timeslot being edited', () => {
    const DRAFT = { start: '11:00', end: '12:00' };

    async function setupEditing() {
      const scenario = await setup();
      await firstValueFrom(
        scenario.store.dispatch(
          new StartEditingTimeslot(scenario.timeslot.timeslotId),
        ),
      );
      const getDraft = () => {
        const { start, end } =
          scenario.store.selectSnapshot(PlanningState.editingTimeslot) ?? {};
        return { start, end };
      };
      return { ...scenario, getDraft };
    }

    it('should have no draft by default', async () => {
      const { store } = await setup();

      expect(store.selectSnapshot(PlanningState.editingTimeslot)).toBeNull();
    });

    it('should keep the draft of the timeslot being edited', async () => {
      const { store, getDraft } = await setupEditing();

      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      expect(getDraft()).toEqual(DRAFT);
    });

    it('should ignore a draft when no timeslot is being edited', async () => {
      const { store } = await setup();

      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      expect(store.selectSnapshot(PlanningState.editingTimeslot)).toBeNull();
    });

    it('should keep the draft when the same timeslot starts being edited again', async () => {
      const { store, timeslot, getDraft } = await setupEditing();
      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(timeslot.timeslotId)),
      );

      expect(getDraft()).toEqual(DRAFT);
    });

    it('should drop the draft when another timeslot starts being edited', async () => {
      const { store, getDraft } = await setupEditing();
      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      await firstValueFrom(
        store.dispatch(new StartEditingTimeslot(MISSING_TIMESLOT_ID)),
      );

      expect(getDraft()).toEqual({});
    });

    it('should drop the draft when editing stops', async () => {
      const { store, getDraft } = await setupEditing();
      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      await firstValueFrom(store.dispatch(new StopEditingTimeslot()));

      expect(getDraft()).toEqual({});
    });

    it('should drop the draft when its timeslot is deleted', async () => {
      const { store, timeslot, getDraft } = await setupEditing();
      await firstValueFrom(store.dispatch(new UpdateEditingTimeslot(DRAFT)));

      await firstValueFrom(
        store.dispatch(new DeleteTimeslot(timeslot.timeslotId)),
      );

      expect(getDraft()).toEqual({});
    });
  });

  describe('CreateAppointment', () => {
    it('should add an appointment for the timeslot to the given week only', async () => {
      const { timeslot, week, getAppointments } = await setup({
        withAppointment: true,
      });

      expect(getAppointments()).toEqual([
        expect.objectContaining({ ...week, timeslotId: timeslot.timeslotId }),
      ]);
      expect(getAppointments(createWeek({ week: week.week + 1 }))).toEqual([]);
      expect(getAppointments(createWeek({ year: week.year + 1 }))).toEqual([]);
    });

    it('should error when the timeslot does not exist', async () => {
      const { store, week } = await setup();

      await expect(
        firstValueFrom(
          store.dispatch(new CreateAppointment(MISSING_TIMESLOT_ID, week)),
        ),
      ).rejects.toThrow(timeslotNotFoundMessage(MISSING_TIMESLOT_ID));
    });
  });

  describe('LoadAppointmentsByWeek', () => {
    it('should load the appointments for the week from the service', async () => {
      const { store, timeslotService, timeslot, week, getAppointments } =
        await setup();
      const created = await firstValueFrom(
        timeslotService.createAppointment(timeslot.timeslotId, week),
      );

      await firstValueFrom(store.dispatch(new LoadAppointmentsByWeek(week)));

      expect(getAppointments()).toEqual([created]);
    });

    it('should keep appointments already loaded for other weeks', async () => {
      const { store, timeslotService, timeslot, week, getAppointments } =
        await setup({ withAppointment: true });
      const nextWeek = createWeek({ week: week.week + 1 });
      await firstValueFrom(
        timeslotService.createAppointment(timeslot.timeslotId, nextWeek),
      );

      await firstValueFrom(
        store.dispatch(new LoadAppointmentsByWeek(nextWeek)),
      );

      expect(getAppointments(week)).toHaveLength(1);
      expect(getAppointments(nextWeek)).toHaveLength(1);
    });
  });

  describe('SetAvailability', () => {
    it('should set the availability on the appointment, replacing the same participant', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      const replacement = createAvailability({
        status: AvailabilityStatus.IfNeeded,
      });
      await firstValueFrom(
        store.dispatch(
          new SetAvailability(appointmentId, createAvailability()),
        ),
      );

      await firstValueFrom(
        store.dispatch(new SetAvailability(appointmentId, replacement)),
      );

      expect(getAppointment().availabilities).toEqual([replacement]);
    });

    it('should error when the appointment does not exist', async () => {
      const { store } = await setup();

      await expect(
        firstValueFrom(
          store.dispatch(
            new SetAvailability(MISSING_APPOINTMENT_ID, createAvailability()),
          ),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('RemoveAvailability', () => {
    it("should remove only the participant's availability", async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      const removed = createAvailability();
      const kept = createAvailability({ participantId: 'member-2' });
      for (const availability of [removed, kept]) {
        await firstValueFrom(
          store.dispatch(new SetAvailability(appointmentId, availability)),
        );
      }

      await firstValueFrom(
        store.dispatch(
          new RemoveAvailability(appointmentId, removed.participantId),
        ),
      );

      expect(getAppointment().availabilities).toEqual([kept]);
    });
  });

  describe('SetProspect', () => {
    it('should set the prospect on the appointment', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });

      await firstValueFrom(
        store.dispatch(
          new SetProspect(getAppointment().appointmentId, 'prospect-1'),
        ),
      );

      expect(getAppointment().prospectId).toBe('prospect-1');
    });
  });

  describe('RemoveProspect', () => {
    it('should clear the prospect from the appointment', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      await firstValueFrom(
        store.dispatch(new SetProspect(appointmentId, 'prospect-1')),
      );

      await firstValueFrom(store.dispatch(new RemoveProspect(appointmentId)));

      expect(getAppointment().prospectId).toBeUndefined();
    });
  });

  describe('ConfirmParticipant', () => {
    it('should add the participant to those already confirmed', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      await firstValueFrom(
        store.dispatch(new ConfirmParticipant(appointmentId, 'member-1')),
      );

      await firstValueFrom(
        store.dispatch(new ConfirmParticipant(appointmentId, 'member-2')),
      );

      expect(getAppointment().confirmedUserIds).toEqual([
        'member-1',
        'member-2',
      ]);
    });

    it('should not confirm the same participant twice', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();

      for (let attempt = 0; attempt < 2; attempt++) {
        await firstValueFrom(
          store.dispatch(new ConfirmParticipant(appointmentId, 'member-1')),
        );
      }

      expect(getAppointment().confirmedUserIds).toEqual(['member-1']);
    });

    it('should error when the appointment is not in the store', async () => {
      const { store } = await setup();

      await expect(
        firstValueFrom(
          store.dispatch(
            new ConfirmParticipant(MISSING_APPOINTMENT_ID, 'member-1'),
          ),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });

  describe('UnconfirmParticipant', () => {
    it('should remove only the given participant from those confirmed', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      for (const participantId of ['member-1', 'member-2']) {
        await firstValueFrom(
          store.dispatch(new ConfirmParticipant(appointmentId, participantId)),
        );
      }

      await firstValueFrom(
        store.dispatch(new UnconfirmParticipant(appointmentId, 'member-1')),
      );

      expect(getAppointment().confirmedUserIds).toEqual(['member-2']);
    });

    it('should leave confirmations unchanged when the participant is not confirmed', async () => {
      const { store, getAppointment } = await setup({ withAppointment: true });
      const { appointmentId } = getAppointment();
      await firstValueFrom(
        store.dispatch(new ConfirmParticipant(appointmentId, 'member-1')),
      );

      await firstValueFrom(
        store.dispatch(new UnconfirmParticipant(appointmentId, 'member-2')),
      );

      expect(getAppointment().confirmedUserIds).toEqual(['member-1']);
    });

    it('should error when the appointment is not in the store', async () => {
      const { store } = await setup();

      await expect(
        firstValueFrom(
          store.dispatch(
            new UnconfirmParticipant(MISSING_APPOINTMENT_ID, 'member-1'),
          ),
        ),
      ).rejects.toThrow(appointmentNotFoundMessage(MISSING_APPOINTMENT_ID));
    });
  });
});
