import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Store } from '@ngxs/store';
import { Availability, AvailabilityStatus, User, UserRole } from '@org/models';
import {
  AppointmentWeek,
  SEED_USERS,
  TimeslotService,
} from '@org/scheduler-ui/data';
import { LoadUsers, SetCurrentUser } from '@org/scheduler-ui/state';
import { CommonTest, provideTestState } from '@org/scheduler-ui/test-utils';
import { firstValueFrom, throwError } from 'rxjs';
import { SET_AVAILABILITY_PLACEHOLDER } from '../availability-select/availability-select.component';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';
import {
  AppointmentCardComponent,
  UNKNOWN_MEMBER_NAME,
} from './appointment-card.component';
import { AppointmentCardHarness } from './appointment-card.harness';

/** A week in a year long past, which has none of the appointments that are seeded around today */
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

interface SetupOptions {
  /** The availabilities already set on the appointment */
  availabilities?: Availability[];
  /** The user signed in, whose availability is shown */
  user?: User | null;
  /** Runs the enter and leave animations, which TestBed disables unless asked */
  animated?: boolean;
}

async function setup({
  availabilities = [],
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
    service.createAppointment(timeslot.timeslotId, PAST_WEEK),
  );
  for (const availability of availabilities) {
    appointment = await firstValueFrom(
      service.setAvailability(appointment.appointmentId, availability),
    );
  }

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
      const select = await harness.availabilitySelect();

      expect(await select.getOptions()).toEqual(
        STATUSES.map((status) => AVAILABILITY_STATUS_LABELS[status]),
      );
    });

    it('should ask the user to set their availability when they have not', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ memberId: 'other-member' })],
      });
      const select = await harness.availabilitySelect();

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
        const select = await harness.availabilitySelect();

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
        await (await harness.availabilitySelect()).getSelectedStatus(),
      ).toBe(AvailabilityStatus.IfNeeded);
    });

    it('should save the status that is chosen as the availability of the user', async () => {
      const { harness, user, getSavedAvailabilities } = await setup();
      const select = await harness.availabilitySelect();

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
        const select = await harness.availabilitySelect();

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
      const select = await harness.availabilitySelect();

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
      const select = await harness.availabilitySelect();

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

      expect(await (await harness.availabilitySelect()).isDisabled()).toBe(
        true,
      );
    });
  });

  describe('the availability of the other members', () => {
    const [, member, prospect] = SEED_USERS;

    it('should show the name of each of the other members with their status', async () => {
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

      expect(await harness.getOtherAvailabilities()).toEqual([
        { name: member.displayName, status: AvailabilityStatus.IfNeeded },
        { name: prospect.displayName, status: AvailabilityStatus.Unavailable },
      ]);
    });

    it('should not list the availability of the user among the others', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability()],
      });

      expect(await harness.getOtherAvailabilities()).toEqual([]);
    });

    it('should list no one when no other member has set their availability', async () => {
      const { harness } = await setup();

      expect(await harness.getOtherAvailabilities()).toEqual([]);
    });

    it('should name a member whose user is not known', async () => {
      const { harness } = await setup({
        availabilities: [createAvailability({ memberId: 'unknown-member' })],
      });

      expect(await harness.getOtherAvailabilities()).toEqual([
        {
          name: UNKNOWN_MEMBER_NAME,
          status: AvailabilityStatus.Available,
        },
      ]);
    });

    it('should show the availability of a member once it is set', async () => {
      const { fixture, harness, appointment } = await setup();
      expect(await harness.getOtherAvailabilities()).toEqual([]);

      fixture.componentRef.setInput('appointment', {
        ...appointment,
        availabilities: [createAvailability({ memberId: member.id })],
      });

      expect(await harness.getOtherAvailabilities()).toEqual([
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
        await (await harness.availabilitySelect()).getSelectedStatus(),
      ).toBe(AvailabilityStatus.IfNeeded);
    });
  });
});
