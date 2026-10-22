import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import {
  Appointment,
  AvailabilityStatus,
  Timeslot,
  UserRole,
} from '@scheduler/models';
import { ExpandableCard } from '@scheduler/ui/core-ui';
import {
  ConfirmParticipant,
  LocalUserState,
  SetAvailability,
  UnconfirmParticipant,
  UsersState,
} from '@scheduler/ui/state';
import { firstValueFrom } from 'rxjs';
import {
  AvailabilitySelectComponent,
  SET_AVAILABILITY_PLACEHOLDER,
} from '../availability-select/availability-select.component';
import { ParticipantAvailabilityComponent } from '../participant-availability/participant-availability.component';
import { dateInWeek, hasTimeslotEnded } from '../timeslot-time';
import { formatTimeRange } from '../open-timeslot-card/open-timeslot-card.component';

export const EDIT_APPOINTMENT_LABEL = 'Edit appointment';
/** Shown for a participant whose user is not known, such as before the users are loaded */
export const UNKNOWN_PARTICIPANT_NAME = 'Unknown participant';
export const CONFIRMED_NOTICE =
  'You are confirmed to attend. If you cannot, contact a coordinator.';
export const CONFIRM_PARTICIPANTS_INSTRUCTION =
  'Check the participants to confirm them for the appointment.';
export const FACILITATORS_TITLE = 'Facilitators';
export const PROSPECT_TITLE = 'Prospect';
/** The order participants are listed in, by how well they can attend */
const STATUS_ORDER: readonly AvailabilityStatus[] = [
  AvailabilityStatus.Available,
  AvailabilityStatus.IfNeeded,
  AvailabilityStatus.Unavailable,
];
/** Only participants who can attend can be confirmed */
const CONFIRMABLE_STATUSES: readonly AvailabilityStatus[] = [
  AvailabilityStatus.Available,
  AvailabilityStatus.IfNeeded,
];

/**
 * A timeslot of a week that has an appointment. The current user chooses their availability for it
 * right on the card, and sees the availability of the other participants. A coordinator can expand the
 * card to edit the appointment.
 */
@Component({
  selector: 'lib-appointment-card',
  imports: [
    AvailabilitySelectComponent,
    MatIcon,
    MatIconButton,
    ParticipantAvailabilityComponent,
  ],
  templateUrl: './appointment-card.component.html',
  styleUrl: './appointment-card.component.scss',
})
export class AppointmentCardComponent extends ExpandableCard {
  private readonly store = inject(Store);

  readonly timeslot = input.required<Timeslot>();
  readonly appointment = input.required<Appointment>();

  private readonly currentUser = this.store.selectSignal(
    LocalUserState.currentUser,
  );
  private readonly usersById = this.store.selectSignal(UsersState.usersById);
  private readonly saving = signal(false);
  private readonly editing = signal(false);

  protected readonly placeholder = SET_AVAILABILITY_PLACEHOLDER;
  protected readonly editLabel = EDIT_APPOINTMENT_LABEL;
  protected readonly confirmedNotice = CONFIRMED_NOTICE;
  protected readonly confirmInstruction = CONFIRM_PARTICIPANTS_INSTRUCTION;
  protected readonly timeRange = computed(() =>
    formatTimeRange(this.timeslot()),
  );
  private readonly isCoordinator = this.store.selectSignal(
    LocalUserState.hasRole(UserRole.Coordinator),
  );
  /** Whether the timeslot of the appointment has ended, after which nothing can be changed */
  protected readonly isPast = computed(() => {
    const { year, week } = this.appointment();
    const { dayOfWeek } = this.timeslot();
    return hasTimeslotEnded(
      dateInWeek({ year, week }, dayOfWeek),
      this.timeslot(),
    );
  });
  /** Only coordinators edit the appointment, and only until it is over */
  protected readonly canEdit = computed(
    () => this.isCoordinator() && !this.isPast(),
  );
  /** The status the current user set, if they have */
  protected readonly status = computed(() => {
    const user = this.currentUser();
    return (
      this.appointment().availabilities.find(
        ({ participantId }) => participantId === user?.id,
      )?.status ?? null
    );
  });
  /** The availability of all the participants, the current user included, with their names */
  private readonly participants = computed(() => {
    const user = this.currentUser();
    const users = this.usersById();
    const { availabilities, confirmedUserIds } = this.appointment();
    const editing = this.expanded();
    return availabilities.map(({ participantId, status }) => ({
      participantId,
      status,
      confirmed: confirmedUserIds.includes(participantId),
      confirmable: editing,
      confirmDisabled: !CONFIRMABLE_STATUSES.includes(status),
      isProspect: !!users[participantId]?.roles.includes(UserRole.Prospect),
      name:
        users[participantId]?.displayName ??
        (participantId === user?.id
          ? user.displayName
          : UNKNOWN_PARTICIPANT_NAME),
    }));
  });
  /**
   * The participants in a section for the facilitators and one for the prospect, each by their
   * availability. Outside of editing, a section with confirmed participants shows only those.
   */
  protected readonly sections = computed(() => {
    const participants = this.participants();
    const editing = this.expanded();
    return [
      {
        title: FACILITATORS_TITLE,
        participants: participants.filter(({ isProspect }) => !isProspect),
      },
      {
        title: PROSPECT_TITLE,
        participants: participants.filter(({ isProspect }) => isProspect),
      },
    ]
      .map(({ title, participants: inSection }) => {
        const confirmed = inSection.filter(({ confirmed }) => confirmed);
        const shown = !editing && confirmed.length ? confirmed : inSection;
        return {
          title,
          participants: [...shown].sort(
            (first, second) =>
              STATUS_ORDER.indexOf(first.status) -
              STATUS_ORDER.indexOf(second.status),
          ),
        };
      })
      .filter(({ participants: inSection }) => inSection.length);
  });
  /** A user who is confirmed can no longer change their availability, but has to contact the coordinator */
  protected readonly confirmed = computed(() => {
    const user = this.currentUser();
    return !!user && this.appointment().confirmedUserIds.includes(user.id);
  });
  /** The card expands for a coordinator to edit the appointment */
  readonly expanded = computed(() => this.editing() && this.canEdit());

  /** The status that is chosen, which is the saved one except while a new choice is being saved */
  protected readonly chosen = linkedSignal(() => this.status());
  /** Availability is for the current user, and is changed once at a time, until the appointment is over */
  protected readonly canChange = computed(
    () => this.currentUser() !== null && !this.saving() && !this.isPast(),
  );

  protected toggleEditing(): void {
    this.editing.update((editing) => !editing);
  }

  /** Confirms the participant for the appointment, or takes their confirmation back */
  protected async confirm(
    participantId: string,
    confirmed: boolean,
  ): Promise<void> {
    const appointmentId = this.appointment().appointmentId;
    await firstValueFrom(
      this.store.dispatch(
        confirmed
          ? new ConfirmParticipant(appointmentId, participantId)
          : new UnconfirmParticipant(appointmentId, participantId),
      ),
    );
  }

  /** Saves the status the user chose, going back to the saved one if that fails */
  protected async choose(status: AvailabilityStatus | null): Promise<void> {
    const user = this.currentUser();
    if (!user || !status || this.saving()) {
      return;
    }

    this.chosen.set(status);
    this.saving.set(true);
    try {
      await firstValueFrom(
        this.store.dispatch(
          new SetAvailability(this.appointment().appointmentId, {
            participantId: user.id,
            status,
          }),
        ),
      );
    } catch {
      this.chosen.set(this.status());
    } finally {
      this.saving.set(false);
    }
  }
}
