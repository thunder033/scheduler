import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { AvailabilityStatus } from '@scheduler/models';
import { ExpandableCardHarness } from '@scheduler/ui/core-ui/testing';
import { qaSelector } from '@scheduler/ui/test-utils';
import { AvailabilitySelectHarness } from '../availability-select/availability-select.harness';
import {
  ParticipantAvailabilityHarness,
  ParticipantAvailabilityHarnessFilters,
} from '../participant-availability/participant-availability.harness';

const NO_EDIT_CONTROL_MESSAGE =
  'The card has no control to edit the appointment';
const EDITING_NOT_TOGGLED_MESSAGE =
  'The control did not expand or collapse the card';

export interface AppointmentCardHarnessFilters extends BaseHarnessFilters {
  /** The time range the card shows */
  timeRange?: string | RegExp;
}

/** A group of the participants on the card, such as the facilitators */
export class ParticipantSectionHarness extends ComponentHarness {
  static hostSelector = qaSelector('participant-section');

  private readonly title = this.locatorFor(qaSelector('section-title'));

  async getTitle(): Promise<string> {
    return (await this.title()).text();
  }

  /** The names and statuses of the participants in the section, in display order */
  async getParticipants(): Promise<
    { name: string; status: AvailabilityStatus }[]
  > {
    const participants = await this.locatorForAll(
      ParticipantAvailabilityHarness,
    )();
    return Promise.all(
      participants.map(async (participant) => ({
        name: await participant.getName(),
        status: await participant.getStatus(),
      })),
    );
  }
}

export class AppointmentCardHarness extends ExpandableCardHarness {
  static hostSelector = 'sch-appointment-card';

  static with(
    options: AppointmentCardHarnessFilters = {},
  ): HarnessPredicate<AppointmentCardHarness> {
    return new HarnessPredicate(AppointmentCardHarness, options).addOption(
      'timeRange',
      options.timeRange,
      (harness, timeRange) =>
        HarnessPredicate.stringMatches(harness.getTimeRange(), timeRange),
    );
  }

  /** Where the current user chooses their availability, which is not there once they are confirmed */
  availabilitySelect = this.locatorForOptional(AvailabilitySelectHarness);

  /** Finds the participants whose availability is shown */
  getParticipantAvailability = (
    filters: ParticipantAvailabilityHarnessFilters = {},
  ) => this.locatorFor(ParticipantAvailabilityHarness.with(filters))();

  private readonly confirmedNotice = this.locatorForOptional(
    qaSelector('confirmed-notice'),
  );
  private readonly confirmInstruction = this.locatorForOptional(
    qaSelector('confirm-instruction'),
  );
  private readonly timeRange = this.locatorFor(qaSelector('time-range'));
  /** Only there for a coordinator */
  private readonly editControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('edit-appointment') }),
  );

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  /** The names and statuses of the participants whose availability is shown, in display order */
  async getParticipantAvailabilities(): Promise<
    { name: string; status: AvailabilityStatus }[]
  > {
    const participants = await this.locatorForAll(
      ParticipantAvailabilityHarness,
    )();
    return Promise.all(
      participants.map(async (participant) => ({
        name: await participant.getName(),
        status: await participant.getStatus(),
      })),
    );
  }

  /** The sections the participants are listed in, in display order, each with its participants in display order */
  async getParticipantSections(): Promise<
    {
      title: string;
      participants: { name: string; status: AvailabilityStatus }[];
    }[]
  > {
    const sections = await this.locatorForAll(ParticipantSectionHarness)();
    return Promise.all(
      sections.map(async (section) => ({
        title: await section.getTitle(),
        participants: await section.getParticipants(),
      })),
    );
  }

  /** The notice that the user is confirmed to attend, or null when they are not */
  async getConfirmedNotice(): Promise<string | null> {
    return (await this.confirmedNotice())?.text() ?? null;
  }

  /** Whether the instruction to check participants to confirm them is shown */
  async hasConfirmInstruction(): Promise<boolean> {
    return (await this.confirmInstruction()) !== null;
  }

  /** Whether the control to edit the appointment is there, which it is for a coordinator */
  async hasEditAppointment(): Promise<boolean> {
    return (await this.editControl()) !== null;
  }

  /** Expands the card for the appointment to be edited, or collapses it again */
  async toggleEditingAppointment(): Promise<void> {
    const control = await this.editControl();
    assert(control, NO_EDIT_CONTROL_MESSAGE);
    const wasExpanded = await this.isExpanded();

    await control.click();

    assert(
      (await this.isExpanded()) !== wasExpanded,
      EDITING_NOT_TOGGLED_MESSAGE,
    );
  }
}
