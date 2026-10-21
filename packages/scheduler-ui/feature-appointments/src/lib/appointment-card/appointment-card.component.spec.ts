import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Availability, AvailabilityStatus, User, UserRole } from '@org/models';
import { AppointmentWeek, TimeslotService } from '@org/scheduler-ui/data';
import { mockTimeslot, mockUser } from '@org/scheduler-ui/data/testing';
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

/** A week in a year far ahead, which is not over */
const FUTURE_WEEK: AppointmentWeek = { year: 2099, week: 43 };
/** A week in a year long past, which is over */
const PAST_WEEK: AppointmentWeek = { year: 2001, week: 43 };
const STATUSES = Object.values(AvailabilityStatus);
/** The users that exist from the start, whose names are shown for the participants */
/** The user signed in unless a test signs in another, whose availability is the default one */
const SIGNED_IN_USER = mockUser();
const SEEDED_USERS = [mockUser.COORDINATOR, mockUser.MEMBER, mockUser.PROSPECT];

function createAvailability(
  overrides: Partial<Availability> = {},
): Availability {
  return {
    participantId: SIGNED_IN_USER.id,
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
  user = SIGNED_IN_USER,
  animated = false,
}: SetupOptions = {}) {
  const timeslot = mockTimeslot.MONDAY_MORNING;
  await TestBed.configureTestingModule({
    imports: [AppointmentCardComponent],
    providers: [
      provideTestState({ users: SEEDED_USERS, timeslots: [timeslot] }),
    ],
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
  it('displays the time range of the timeslot', async () => {
    const { harness, timeslot } = await setup();

    expect(await harness.getTimeRange()).toBe(formatTimeRange(timeslot));
  });

  describe('the availability of the user', () => {
    it('offers every availability status', async () => {
      const { harness } = await setup();
      const select = await getAvailabilitySelect(harness);

      expect(await select.getOptions()).toEqual(
        STATUSES.map((status) => AVAILABILITY_STATUS_LABELS[status]),
      );
    });

    it('asks the user to set their availability when they have not', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ participantId: 'other-member' })],
      });
      const select = await getAvailabilitySelect(harness);

      expect(await select.getPlaceholder()).toBe(SET_AVAILABILITY_PLACEHOLDER);
      expect(await select.getSelectedStatus()).toBeNull();
    });

    it.each(STATUSES)(
      'shows the %s status the user has set, with its color',
      async (status) => {
        const { harness } = await setup({
          availabilities: [
            createAvailability({ participantId: 'other-member' }),
            createAvailability({ status }),
          ],
        });
        const select = await getAvailabilitySelect(harness);

        expect(await select.getSelectedStatus()).toBe(status);
        expect(await select.getPlaceholder()).toBeNull();
      },
    );

    it('shows the status once the user sets it', async () => {
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

    it('saves the status that is chosen as the availability of the user', async () => {
      const { harness, user, getSavedAvailabilities } = await setup();
      const select = await getAvailabilitySelect(harness);

      await select.selectOption(
        AVAILABILITY_STATUS_LABELS[AvailabilityStatus.IfNeeded],
      );

      expect(await getSavedAvailabilities()).toEqual([
        { participantId: user?.id, status: AvailabilityStatus.IfNeeded },
      ]);
    });

    it.each(STATUSES)(
      'saves the %s status when it is chosen',
      async (status) => {
        const { harness, user, getSavedAvailabilities } = await setup();
        const select = await getAvailabilitySelect(harness);

        await select.selectOption(AVAILABILITY_STATUS_LABELS[status]);

        expect(await getSavedAvailabilities()).toEqual([
          { participantId: user?.id, status },
        ]);
      },
    );

    it('replaces the availability the user has set, leaving those of others', async () => {
      const other = createAvailability({ participantId: 'other-member' });
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
        participantId: user?.id,
        status: AvailabilityStatus.Unavailable,
      });
    });

    it('shows the saved status again when saving the choice fails', async () => {
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

    it('does not let the user choose without a user', async () => {
      const { harness } = await setup({ user: null });

      expect(await (await getAvailabilitySelect(harness)).isDisabled()).toBe(
        true,
      );
    });
  });

  describe('the availability of the participants', () => {
    const { MEMBER: member, PROSPECT: prospect } = mockUser;

    it('shows the name of each of the participants with their status', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability(),
          createAvailability({
            participantId: member.id,
            status: AvailabilityStatus.IfNeeded,
          }),
          createAvailability({
            participantId: prospect.id,
            status: AvailabilityStatus.Unavailable,
          }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        {
          name: SIGNED_IN_USER.displayName,
          status: AvailabilityStatus.Available,
        },
        { name: member.displayName, status: AvailabilityStatus.IfNeeded },
        { name: prospect.displayName, status: AvailabilityStatus.Unavailable },
      ]);
    });

    it('lists the availability of the user among the others', async () => {
      const user = mockUser.COORDINATOR;
      const { harness } = await setup({
        user,
        availabilities: [
          createAvailability({
            participantId: user.id,
            status: AvailabilityStatus.IfNeeded,
          }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        { name: user.displayName, status: AvailabilityStatus.IfNeeded },
      ]);
    });

    it('lists no one when no participant has set their availability', async () => {
      const { harness } = await setup();

      expect(await harness.getParticipantAvailabilities()).toEqual([]);
    });

    it('names a participant whose user is not known', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability({ participantId: 'unknown-member' }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        {
          name: UNKNOWN_PARTICIPANT_NAME,
          status: AvailabilityStatus.Available,
        },
      ]);
    });

    it('shows the availability of a participant once it is set', async () => {
      const { fixture, harness, appointment } = await setup();
      expect(await harness.getParticipantAvailabilities()).toEqual([]);

      fixture.componentRef.setInput('appointment', {
        ...appointment,
        availabilities: [createAvailability({ participantId: member.id })],
      });

      expect(await harness.getParticipantAvailabilities()).toEqual([
        { name: member.displayName, status: AvailabilityStatus.Available },
      ]);
    });
  });

  describe('editing the appointment', () => {
    const coordinator = mockUser.COORDINATOR;

    it('offers editing to a coordinator', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.hasEditAppointment()).toBe(true);
    });

    it.each([
      [UserRole.Member, mockUser.MEMBER],
      [UserRole.Prospect, mockUser.PROSPECT],
    ])('does not offer editing to a %s', async (_role, user) => {
      const { harness } = await setup({ user });

      expect(await harness.hasEditAppointment()).toBe(false);
    });

    it('does not offer editing without a user', async () => {
      const { harness } = await setup({ user: null });

      expect(await harness.hasEditAppointment()).toBe(false);
    });

    it('is not expanded by default', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.isExpanded()).toBe(false);
      expect(await harness.hasContent()).toBe(false);
    });

    it('expands when editing starts and collapses when it stops', async () => {
      const { harness } = await setup({ user: coordinator });

      await harness.toggleEditingAppointment();
      expect(await harness.isExpanded()).toBe(true);
      expect(await harness.hasContent()).toBe(true);

      await harness.toggleEditingAppointment();
      expect(await harness.isExpanded()).toBe(false);
      expect(await harness.hasContent()).toBe(false);
    });

    it('animates the content in when it expands', async () => {
      const { harness } = await setup({ user: coordinator, animated: true });

      await harness.toggleEditingAppointment();

      expect(await harness.isContentAnimating()).toBe(true);
    });

    it('keeps the availability of the user while it is expanded', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [
          createAvailability({
            participantId: coordinator.id,
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
    const coordinator = mockUser.COORDINATOR;
    const { MEMBER: member, PROSPECT: prospect } = mockUser;

    async function setupEditing(options: SetupOptions = {}) {
      const result = await setup({ user: coordinator, ...options });
      await result.harness.toggleEditingAppointment();
      return result;
    }

    it('explains how to confirm participants while editing', async () => {
      const { harness } = await setupEditing();

      expect(await harness.hasConfirmInstruction()).toBe(true);
    });

    it('does not explain it when not editing', async () => {
      const { harness } = await setup({ user: coordinator });

      expect(await harness.hasConfirmInstruction()).toBe(false);
    });

    it.each([AvailabilityStatus.Available, AvailabilityStatus.IfNeeded])(
      'offers to confirm a participant who is %s while editing',
      async (status) => {
        const { harness } = await setupEditing({
          availabilities: [
            createAvailability({ participantId: member.id, status }),
          ],
        });

        expect(
          await (
            await harness.getParticipantAvailability()
          ).hasConfirmControl(),
        ).toBe(true);
      },
    );

    it('shows the checkbox of a participant who is unavailable, disabled', async () => {
      const { harness } = await setupEditing({
        availabilities: [
          createAvailability({
            participantId: member.id,
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
      'enables the checkbox of a participant who is %s',
      async (status) => {
        const { harness } = await setupEditing({
          availabilities: [
            createAvailability({ participantId: member.id, status }),
          ],
        });

        expect(
          await (
            await harness.getParticipantAvailability()
          ).isConfirmDisabled(),
        ).toBe(false);
      },
    );

    it('does not offer to confirm anyone when not editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ participantId: member.id })],
      });

      expect(
        await (await harness.getParticipantAvailability()).hasConfirmControl(),
      ).toBe(false);
    });

    it('confirms the participant that is checked', async () => {
      const { harness, getSavedConfirmedUserIds } = await setupEditing({
        availabilities: [
          createAvailability({ participantId: member.id }),
          createAvailability({ participantId: prospect.id }),
        ],
      });

      await (
        await harness.getParticipantAvailability({ name: member.displayName })
      ).toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([member.id]);
    });

    it('takes back the confirmation of a participant that is unchecked', async () => {
      const { harness, getSavedConfirmedUserIds } = await setupEditing({
        availabilities: [createAvailability({ participantId: member.id })],
        confirmedUserIds: [member.id],
      });
      const participantAvailability =
        await harness.getParticipantAvailability();
      expect(await participantAvailability.isConfirmed()).toBe(true);

      await participantAvailability.toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([]);
    });

    it('marks a confirmed participant as confirmed when not editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [
          createAvailability({ participantId: member.id }),
          createAvailability({ participantId: prospect.id }),
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
    const coordinator = mockUser.COORDINATOR;

    it('offers to confirm the user among the participants while editing', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ participantId: coordinator.id })],
      });
      const own = await harness.getParticipantAvailability({
        name: coordinator.displayName,
      });
      expect(await own.hasConfirmControl()).toBe(false);

      await harness.toggleEditingAppointment();

      expect(await own.hasConfirmControl()).toBe(true);
      expect(await own.isConfirmDisabled()).toBe(false);
    });

    it('confirms the user that checks their own availability', async () => {
      const { harness, getSavedConfirmedUserIds } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ participantId: coordinator.id })],
      });
      await harness.toggleEditingAppointment();

      await (await harness.getParticipantAvailability()).toggleConfirmed();

      expect(await getSavedConfirmedUserIds()).toEqual([coordinator.id]);
    });
  });

  describe('once the user is confirmed', () => {
    it('replaces the availability of the user with a notice that they are confirmed', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability()],
        confirmedUserIds: [SIGNED_IN_USER.id],
      });

      expect(await harness.availabilitySelect()).toBeNull();
      expect(await harness.getConfirmedNotice()).toBe(CONFIRMED_NOTICE);
    });

    it('lets the user change their availability when someone else is confirmed', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability()],
        confirmedUserIds: ['other-member'],
      });

      expect(await harness.availabilitySelect()).not.toBeNull();
      expect(await harness.getConfirmedNotice()).toBeNull();
    });

    it('offers the availability again when the confirmation is taken back', async () => {
      const user = mockUser.COORDINATOR;
      const { fixture, harness, service, appointment } = await setup({
        user,
        availabilities: [createAvailability({ participantId: user.id })],
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
    const { MEMBER: member, PROSPECT: prospect } = mockUser;
    const coordinator = mockUser.COORDINATOR;

    it('lists the facilitators apart from the prospect', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability({ participantId: prospect.id }),
          createAvailability({ participantId: member.id }),
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

    it('includes coordinators among the facilitators', async () => {
      const { harness } = await setup({
        user: coordinator,
        availabilities: [createAvailability({ participantId: coordinator.id })],
      });

      const [section] = await harness.getParticipantSections();

      expect(section.title).toBe(FACILITATORS_TITLE);
      expect(section.participants).toHaveLength(1);
    });

    it('leaves out a section without anyone in it', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ participantId: prospect.id })],
      });

      expect(
        (await harness.getParticipantSections()).map(({ title }) => title),
      ).toEqual([PROSPECT_TITLE]);
    });

    it('lists no sections without any availability', async () => {
      const { harness } = await setup();

      expect(await harness.getParticipantSections()).toEqual([]);
    });

    it('orders each section from available to unavailable', async () => {
      const { harness } = await setup({
        availabilities: [
          createAvailability({
            participantId: 'unavailable-member',
            status: AvailabilityStatus.Unavailable,
          }),
          createAvailability({
            participantId: 'if-needed-member',
            status: AvailabilityStatus.IfNeeded,
          }),
          createAvailability({
            participantId: 'available-member',
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
        createAvailability({ participantId: member.id }),
        createAvailability({ participantId: 'other-member' }),
        createAvailability({ participantId: prospect.id }),
      ];

      it('lists only the confirmed in a section that has some, outside of editing', async () => {
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

      it('lists everyone while editing', async () => {
        const { harness } = await setup({
          user: coordinator,
          availabilities,
          confirmedUserIds: [member.id],
        });

        await harness.toggleEditingAppointment();
        const [facilitators] = await harness.getParticipantSections();

        expect(facilitators.participants).toHaveLength(2);
      });

      it('lists everyone again after editing', async () => {
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
    const coordinator = mockUser.COORDINATOR;

    it('does not offer editing, even to a coordinator', async () => {
      const { harness } = await setup({ user: coordinator, week: PAST_WEEK });

      expect(await harness.hasEditAppointment()).toBe(false);
    });

    it('does not let the user change their availability', async () => {
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

    it('still shows the availability of the participants', async () => {
      const { harness } = await setup({
        week: PAST_WEEK,
        availabilities: [
          createAvailability({ participantId: mockUser.MEMBER.id }),
        ],
      });

      expect(await harness.getParticipantAvailabilities()).toHaveLength(1);
    });
  });
});
