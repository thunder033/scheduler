import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Availability, AvailabilityStatus, User, UserRole } from '@org/models';
import {
  AppointmentWeek,
  SEED_USERS,
  TimeslotService,
} from '@org/scheduler-ui/data';
import {
  LoadAppointmentsByWeek,
  LoadUsers,
  SetCurrentUser,
} from '@org/scheduler-ui/state';
import { CommonTest, provideTestState } from '@org/scheduler-ui/test-utils';
import { firstValueFrom, throwError } from 'rxjs';
import { SET_AVAILABILITY_PLACEHOLDER } from '../availability-select/availability-select.component';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';
import {
  AppointmentCardComponent,
  CONFIRMED_NOTICE,
  FACILITATORS_TITLE,
  PROSPECT_TITLE,
  UNKNOWN_PARTICIPANT_NAME,
} from './appointment-card.component';
import { AppointmentCardHarness } from './appointment-card.harness';

/** A week in a year far ahead, which is not over and has none of the appointments that are seeded around today */
const FUTURE_WEEK: AppointmentWeek = { year: 2099, week: 43 };
/** A week in a year long past, which is over */
const PAST_WEEK: AppointmentWeek = { year: 2001, week: 43 };
const STATUSES = Object.values(AvailabilityStatus);

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

/** The select the user changes their availability with, which is not there once they are confirmed */
async function getAvailabilitySelect(harness: AppointmentCardHarness) {
  const select = await harness.availabilitySelect();
  assert(select, 'The card has no select for the availability of the user');
  return select;
}

interface SetupOptions {
  /** The availabilities already set on the appointment */
  availabilities?: Availability[];
  /** The participants already confirmed for the appointment */
  confirmedUserIds?: string[];
  /** The week of the appointment */
  week?: AppointmentWeek;
  /** The user signed in, whose availability is shown */
  user?: User | null;
  /** Runs the enter and leave animations, which TestBed disables unless asked */
  animated?: boolean;
}

async function setup({
  availabilities = [],
  confirmedUserIds = [],
  week = FUTURE_WEEK,
  user = createUser(),
  animated = false,
}: SetupOptions = {}) {
  await TestBed.configureTestingModule({
    imports: [AppointmentCardComponent],
    providers: [provideTestState()],
  }).compileComponents();
  if (animated) {
    CommonTest.withAnimations();
  }

  const store = TestBed.inject(Store);
  await firstValueFrom(store.dispatch(new LoadUsers()));
  if (user) {
    await firstValueFrom(store.dispatch(new SetCurrentUser(user)));
  }

  const service = TestBed.inject(TimeslotService);
  const timeslot = await firstValueFrom(
    service.createTimeslot({ start: '09:00', end: '10:30', dayOfWeek: 1 }),
  );
  let appointment = await firstValueFrom(
    service.createAppointment(timeslot.timeslotId, week),
  );
  for (const availability of availabilities) {
    appointment = await firstValueFrom(
      service.setAvailability(appointment.appointmentId, availability),
    );
  }

  if (confirmedUserIds.length) {
    appointment = await firstValueFrom(
      service.setConfirmedUsers(appointment.appointmentId, confirmedUserIds),
    );
  }

  // Confirming looks the appointment up in the state, so it has to be loaded
  await firstValueFrom(store.dispatch(new LoadAppointmentsByWeek(week)));

  const fixture = TestBed.createComponent(AppointmentCardComponent);
  fixture.componentRef.setInput('timeslot', timeslot);
  fixture.componentRef.setInput('appointment', appointment);
  const harness = await TestbedHarnessEnvironment.harnessForFixture(
    fixture,
    AppointmentCardHarness,
  );

  return {
    fixture,
    harness,
    service,
    timeslot,
    appointment,
    user,
    /** The availabilities of the appointment as they are saved */
    /** The users confirmed for the appointment as they are saved */
    getSavedConfirmedUserIds: async () =>
      (
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        )
      )?.confirmedUserIds,
    getSavedAvailabilities: async () =>
      (
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        )
      )?.availabilities,
  };
}

describe('AppointmentCardComponent', () => {
  it('should display the time range of the timeslot', async () => {
    const { harness, timeslot } = await setup();

    expect(await harness.getTimeRange()).toBe(formatTimeRange(timeslot));
  });

  describe('the availability of the user', () => {
    it('should offer every availability status', async () => {
      const { harness } = await setup();
      const select = await getAvailabilitySelect(harness);

      expect(await select.getOptions()).toEqual(
        STATUSES.map((status) => AVAILABILITY_STATUS_LABELS[status]),
      );
    });

    it('should ask the user to set their availability when they have not', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ memberId: 'other-member' })],
      });
      const select = await getAvailabilitySelect(harness);

      expect(await select.getPlaceholder()).toBe(SET_AVAILABILITY_PLACEHOLDER);
      expect(await select.getSelectedStatus()).toBeNull();
    });

    it.each(STATUSES)(
      'should show the %s status the user has set, with its color',
      async (status) => {
        const { harness } = await setup({
          availabilities: [
            createAvailability({ memberId: 'other-member' }),
            createAvailability({ status }),
          ],
        });
        const select = await getAvailabilitySelect(harness);

        expect(await select.getSelectedStatus()).toBe(status);
        expect(await select.getPlaceholder()).toBeNull();
      },
    );

    it('should show the status once the user sets it', async () => {
      const { fixture, harness, appointment } = await setup();

      fixture.componentRef.setInput('appointment', {
        ...appointment,
        availabilities: [
          createAvailability({ status: AvailabilityStatus.IfNeeded }),
        ],
      });

      expect(
        await (await getAvailabilitySelect(harness)).getSelectedStatus(),
      ).toBe(AvailabilityStatus.IfNeeded);
    });

    it('should save the status that is chosen as the availability of the user', async () => {
      const { harness, user, getSavedAvailabilities } = await setup();
      const select = await getAvailabilitySelect(harness);

      await select.selectOption(
        AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
      );

      expect(await getSavedAvailabilities()).toEqual([
        { memberId: user?.id, status: AvailabilityStatus.IfNeeded },
      ]);
    });

    it.each(STATUSES)(
      'should save the %s status when it is chosen',
      async (status) => {
        const { harness, user, getSavedAvailabilities } = await setup();
        const select = await getAvailabilitySelect(harness);

        await select.selectOption(AVAILABILITY_STATUS_LABELS[status]);

        expect(await getSavedAvailabilities()).toEqual([
          { memberId: user?.id, status },
        ]);
      },
    );

    it('should replace the availability the user has set, leaving those of others', async () => {
      const other = createAvailability({ memberId: 'other-member' });
      const { harness, user, getSavedAvailabilities } = await setup({
        availabilities: [other, createAvailability()],
      });
      const select = await getAvailabilitySelect(harness);

      await select.selectOption(
        AVAILABILITY_STATUS_LABELS[AvailabilityStatus.Unavailable],
      );

      const saved = await getSavedAvailabilities();
      expect(saved).toHaveLength(2);
      expect(saved).toContainEqual(other);
      expect(saved).toContainEqual({
        memberId: user?.id,
        status: AvailabilityStatus.Unavailable,
      });
    });

    it('should show the saved status again when saving the choice fails', async () => {
      const { harness, service, getSavedAvailabilities } = await setup({
        availabilities: [createAvailability()],
      });
      vi.spyOn(service, 'setAvailability').mockReturnValue(
        throwError(() => new Error('The availability was not saved')),
      );
      const select = await getAvailabilitySelect(harness);

      await select.selectOption(
        AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
      );

      expect(await select.getSelectedStatus()).toBe(
        AvailabilityStatus.Available,
      );
      expect(await getSavedAvailabilities()).toEqual([createAvailability()]);
    });

    it('should not let the user choose without a user', async () => {
      const { harness } = await setup({ user: null });

      expect(await (await getAvailabilitySelect(harness)).isDisabled()).toBe(
        true,
      );
    });
  });

  describe('the availability of the participants', () => {
    const [, member, prospect] = SEED_USERS;

    it('should show the name of each of the participants with their status', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability(),
          createAvailability({
            memberId: member.id,
            status: AvailabilityStatus.IfNeeded,
          }),
          createAvailability({
            memberId: prospect.id,
            status: AvailabilityStatus.Unavailable,
          }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        { name: 'Member One', status: AvailabilityStatus.Available },
        { name: member.displayName, status: AvailabilityStatus.IfNeeded },
        { name: prospect.displayName, status: AvailabilityStatus.Unavailable },
      ]);
    });

    it('should list the availability of the user among the others', async () => {
      const user = createUser({ displayName: 'Coordinator One' });
      const { harness } = await setup({
        user,
        availabilities: [
          createAvailability({ status: AvailabilityStatus.IfNeeded }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        { name: user.displayName, status: AvailabilityStatus.IfNeeded },
      ]);
    });

    it('should list no one when no participant has set their availability', async () => {
      const { harness } = await setup();

      expect(await harness.getParticipantAvailabilities()).toEqual([]);
    });

    it('should name a participant whose user is not known', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ memberId: 'unknown-member' })],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        {
          name: UNKNOWN_PARTICIPANT_NAME,
          status: AvailabilityStatus.Available,
        },
      ]);
    });

    it('should show the availability of a participant once it is set', async () => {
      const { fixture, harness, appointment } = await setup();
      expect(await harness.getParticipantAvailabilities()).toEqual([]);

      fixture.componentRef.setInput('appointment', {
        ...appointment,
        availabilities: [createAvailability({ memberId: member.id })],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        { name: member.displayName, status: AvailabilityStatus.Available },
      ]);
    });
  });

  describe('editing the appointment', () => {
    const coordinator = createUser({ roles: [UserRole.Coordinator] });

    it('should offer editing to a coordinator', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.hasEditAppointment()).toBe(true);
    });

    it.each([UserRole.Member, UserRole.Prospect])(
      'should not offer editing to a %s',
      async (role) => {
        const { harness } = await setup({
          user: createUser({ roles: [role] }),
        });

        expect(await harness.hasEditAppointment()).toBe(false);
      },
    );

    it('should not offer editing without a user', async () => {
      const { harness } = await setup({ user: null });

      expect(await harness.hasEditAppointment()).toBe(false);
    });

    it('should not be expanded by default', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.isExpanded()).toBe(false);
      expect(await harness.hasContent()).toBe(false);
    });

    it('should expand when editing starts and collapse when it stops', async () => {
      const { harness } = await setup({ user: coordinator });

      await harness.toggleEditingAppointment();
      expect(await harness.isExpanded()).toBe(true);
      expect(await harness.hasContent()).toBe(true);

      await harness.toggleEditingAppointment();
      expect(await harness.isExpanded()).toBe(false);
      expect(await harness.hasContent()).toBe(false);
    });

    it('should animate the content in when it expands', async () => {
      const { harness } = await setup({ user: coordinator, animated: true });

      await harness.toggleEditingAppointment();

      expect(await harness.isContentAnimating()).toBe(true);
    });

    it('should keep the availability of the user while it is expanded', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [
          createAvailability({
            memberId: coordinator.id,
            status: AvailabilityStatus.IfNeeded,
          }),
        ],
      });

      await harness.toggleEditingAppointment();

      expect(
        await (await getAvailabilitySelect(harness)).getSelectedStatus(),
      ).toBe(AvailabilityStatus.IfNeeded);
    });
  });

  describe('confirming participants', () => {
    const coordinator = createUser({ roles: [UserRole.Coordinator] });
    const [, member, prospect] = SEED_USERS;

    async function setupEditing(options: SetupOptions = {}) {
      const result = await setup({ user: coordinator, ...options });
      await result.harness.toggleEditingAppointment();
      return result;
    }

    it('should explain how to confirm participants while editing', async () => {
      const { harness } = await setupEditing();

      expect(await harness.hasConfirmInstruction()).toBe(true);
    });

    it('should not explain it when not editing', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.hasConfirmInstruction()).toBe(false);
    });

    it.each([AvailabilityStatus.Available, AvailabilityStatus.IfNeeded])(
      'should offer to confirm a participant who is %s while editing',
      async (status) => {
        const { harness } = await setupEditing({
          availabilities: [createAvailability({ memberId: member.id, status })],
        });

        expect(
          await (
            await harness.getParticipantAvailability()
          ).hasConfirmControl(),
        ).toBe(true);
      },
    );

    it('should show the checkbox of a participant who is unavailable, disabled', async () => {
      const { harness } = await setupEditing({
        availabilities: [
          createAvailability({
            memberId: member.id,
            status: AvailabilityStatus.Unavailable,
          }),
        ],
      });
      const participantAvailability =
        await harness.getParticipantAvailability();

      expect(await participantAvailability.hasConfirmControl()).toBe(true);
      expect(await participantAvailability.isConfirmDisabled()).toBe(true);
    });

    it.each([AvailabilityStatus.Available, AvailabilityStatus.IfNeeded])(
      'should enable the checkbox of a participant who is %s',
      async (status) => {
        const { harness } = await setupEditing({
          availabilities: [createAvailability({ memberId: member.id, status })],
        });

        expect(
          await (
            await harness.getParticipantAvailability()
          ).isConfirmDisabled(),
        ).toBe(false);
      },
    );

    it('should not offer to confirm anyone when not editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ memberId: member.id })],
      });

      expect(
        await (await harness.getParticipantAvailability()).hasConfirmControl(),
      ).toBe(false);
    });

    it('should confirm the participant that is checked', async () => {
      const { harness, getSavedConfirmedUserIds } = await setupEditing({
        availabilities: [
          createAvailability({ memberId: member.id }),
          createAvailability({ memberId: prospect.id }),
        ],
      });

      await (
        await harness.getParticipantAvailability({ name: member.displayName })
      ).toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([member.id]);
    });

    it('should take back the confirmation of a participant that is unchecked', async () => {
      const { harness, getSavedConfirmedUserIds } = await setupEditing({
        availabilities: [createAvailability({ memberId: member.id })],
        confirmedUserIds: [member.id],
      });
      const participantAvailability =
        await harness.getParticipantAvailability();
      expect(await participantAvailability.isConfirmed()).toBe(true);

      await participantAvailability.toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([]);
    });

    it('should mark a confirmed participant as confirmed when not editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [
          createAvailability({ memberId: member.id }),
          createAvailability({ memberId: prospect.id }),
        ],
        confirmedUserIds: [member.id],
      });

      expect(
        await (
          await harness.getParticipantAvailability({ name: member.displayName })
        ).isConfirmed(),
      ).toBe(true);
      expect(
        await (
          await harness.getParticipantAvailability({
            name: prospect.displayName,
          })
        ).isConfirmed(),
      ).toBe(false);
    });
  });

  describe('confirming the user', () => {
    const coordinator = createUser({ roles: [UserRole.Coordinator] });

    it('should offer to confirm the user among the participants while editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ memberId: coordinator.id })],
      });
      const own = await harness.getParticipantAvailability({
        name: coordinator.displayName,
      });
      expect(await own.hasConfirmControl()).toBe(false);

      await harness.toggleEditingAppointment();

      expect(await own.hasConfirmControl()).toBe(true);
      expect(await own.isConfirmDisabled()).toBe(false);
    });

    it('should confirm the user that checks their own availability', async () => {
      const { harness, getSavedConfirmedUserIds } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ memberId: coordinator.id })],
      });
      await harness.toggleEditingAppointment();

      await (await harness.getParticipantAvailability()).toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([coordinator.id]);
    });
  });

  describe('once the user is confirmed', () => {
    it('should replace the availability of the user with a notice that they are confirmed', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability()],
        confirmedUserIds: ['member-1'],
      });

      expect(await harness.availabilitySelect()).toBeNull();
      expect(await harness.getConfirmedNotice()).toBe(CONFIRMED_NOTICE);
    });

    it('should let the user change their availability when someone else is confirmed', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability()],
        confirmedUserIds: ['other-member'],
      });

      expect(await harness.availabilitySelect()).not.toBeNull();
      expect(await harness.getConfirmedNotice()).toBeNull();
    });

    it('should offer the availability again when the confirmation is taken back', async () => {
      const user = createUser({ roles: [UserRole.Coordinator] });
      const { fixture, harness, service, appointment } = await setup({
        user,
        availabilities: [createAvailability({ memberId: user.id })],
        confirmedUserIds: [user.id],
      });
      await harness.toggleEditingAppointment();

      await (await harness.getParticipantAvailability()).toggleConfirmed();
      // The appointment is passed in, as it is by the week view when the state changes
      fixture.componentRef.setInput(
        'appointment',
        await firstValueFrom(
          service.getAppointmentById(appointment.appointmentId),
        ),
      );

      expect(await harness.getConfirmedNotice()).toBeNull();
      expect(await harness.availabilitySelect()).not.toBeNull();
    });
  });

  describe('the sections of the participants', () => {
    const [, member, prospect] = SEED_USERS;
    const coordinator = createUser({ roles: [UserRole.Coordinator] });

    it('should list the facilitators apart from the prospect', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability({ memberId: prospect.id }),
          createAvailability({ memberId: member.id }),
        ],
      });

      expect(await harness.getParticipantSections()).toEqual([
        {
          title: FACILITATORS_TITLE,
          participants: [
            { name: member.displayName, status: AvailabilityStatus.Available },
          ],
        },
        {
          title: PROSPECT_TITLE,
          participants: [
            {
              name: prospect.displayName,
              status: AvailabilityStatus.Available,
            },
          ],
        },
      ]);
    });

    it('should include coordinators among the facilitators', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ memberId: coordinator.id })],
      });

      const [section] = await harness.getParticipantSections();

      expect(section.title).toBe(FACILITATORS_TITLE);
      expect(section.participants).toHaveLength(1);
    });

    it('should leave out a section without anyone in it', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ memberId: prospect.id })],
      });

      expect(
        (await harness.getParticipantSections()).map(({ title }) => title),
      ).toEqual([PROSPECT_TITLE]);
    });

    it('should list no sections without any availability', async () => {
      const { harness } = await setup();

      expect(await harness.getParticipantSections()).toEqual([]);
    });

    it('should order each section from available to unavailable', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability({
            memberId: 'unavailable-member',
            status: AvailabilityStatus.Unavailable,
          }),
          createAvailability({
            memberId: 'if-needed-member',
            status: AvailabilityStatus.IfNeeded,
          }),
          createAvailability({
            memberId: 'available-member',
            status: AvailabilityStatus.Available,
          }),
        ],
      });

      const [section] = await harness.getParticipantSections();

      expect(section.participants.map(({ status }) => status)).toEqual([
        AvailabilityStatus.Available,
        AvailabilityStatus.IfNeeded,
        AvailabilityStatus.Unavailable,
      ]);
    });

    describe('when participants are confirmed', () => {
      const availabilities = [
        createAvailability({ memberId: member.id }),
        createAvailability({ memberId: 'other-member' }),
        createAvailability({ memberId: prospect.id }),
      ];

      it('should list only the confirmed in a section that has some, outside of editing', async () => {
        const { harness } = await setup({
          availabilities,
          confirmedUserIds: [member.id],
        });

        expect(await harness.getParticipantSections()).toEqual([
          {
            title: FACILITATORS_TITLE,
            participants: [
              {
                name: member.displayName,
                status: AvailabilityStatus.Available,
              },
            ],
          },
          {
            title: PROSPECT_TITLE,
            participants: [
              {
                name: prospect.displayName,
                status: AvailabilityStatus.Available,
              },
            ],
          },
        ]);
      });

      it('should list everyone while editing', async () => {
        const { harness } = await setup({
          user: coordinator,
          availabilities,
          confirmedUserIds: [member.id],
        });

        await harness.toggleEditingAppointment();
        const [facilitators] = await harness.getParticipantSections();

        expect(facilitators.participants).toHaveLength(2);
      });

      it('should list everyone again after editing', async () => {
        const { harness } = await setup({
          user: coordinator,
          availabilities,
          confirmedUserIds: [member.id],
        });
        await harness.toggleEditingAppointment();

        await harness.toggleEditingAppointment();
        const [facilitators] = await harness.getParticipantSections();

        expect(facilitators.participants).toHaveLength(1);
      });
    });
  });

  describe('once the appointment is over', () => {
    const coordinator = createUser({ roles: [UserRole.Coordinator] });

    it('should not offer editing, even to a coordinator', async () => {
      const { harness } = await setup({ user: coordinator, week: PAST_WEEK });

      expect(await harness.hasEditAppointment()).toBe(false);
    });

    it('should not let the user change their availability', async () => {
      const { harness } = await setup({
        week: PAST_WEEK,
        availabilities: [createAvailability()],
      });
      const select = await getAvailabilitySelect(harness);

      expect(await select.isDisabled()).toBe(true);
      expect(await select.getSelectedStatus()).toBe(
        AvailabilityStatus.Available,
      );
    });

    it('should still show the availability of the participants', async () => {
      const { harness } = await setup({
        week: PAST_WEEK,
        availabilities: [createAvailability({ memberId: SEED_USERS[1].id })],
      });

      expect(await harness.getParticipantAvailabilities()).toHaveLength(1);
    });
  });
});
