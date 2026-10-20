import { BaseHarnessFilters, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { AvailabilityStatus } from '@org/models';
import { ExpandableCardHarness } from '@org/scheduler-ui/core-ui/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilitySelectHarness } from '../availability-select/availability-select.harness';
import { MemberAvailabilityHarness } from '../member-availability/member-availability.harness';

const NO_EDIT_CONTROL_MESSAGE =
  'The card has no control to edit the appointment';
const EDITING_NOT_TOGGLED_MESSAGE =
  'The control did not expand or collapse the card';

export interface AppointmentCardHarnessFilters extends BaseHarnessFilters {
  /** The time range the card shows */
  timeRange?: string | RegExp;
}

export class AppointmentCardHarness extends ExpandableCardHarness {
  static hostSelector = 'lib-appointment-card';

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

  /** Where the current user chooses their availability, which is always there */
  availabilitySelect = this.locatorFor(AvailabilitySelectHarness);

  private readonly timeRange = this.locatorFor(qaSelector('time-range'));
  /** Only there for a coordinator */
  private readonly editControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('edit-appointment') }),
  );

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  /** The names and statuses of the other members whose availability is shown, in display order */
  async getOtherAvailabilities(): Promise<
    { name: string; status: AvailabilityStatus }[]
  > {
    const members = await this.locatorForAll(MemberAvailabilityHarness)();
    return Promise.all(
      members.map(async (member) => ({
        name: await member.getName(),
        status: await member.getStatus(),
      })),
    );
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
