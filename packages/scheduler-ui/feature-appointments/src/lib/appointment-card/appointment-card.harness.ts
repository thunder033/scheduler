import { BaseHarnessFilters, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ExpandableCardHarness } from '@org/scheduler-ui/core-ui/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilityStatusHarness } from '../availability-status/availability-status.harness';

const NO_EDIT_CONTROL_MESSAGE =
  'The card has no control to add or edit availability';
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

  private readonly timeRange = this.locatorFor(qaSelector('time-range'));
  /** Only there when the current user has set their availability */
  availabilityStatus = this.locatorForOptional(AvailabilityStatusHarness);
  /** Only there when the current user has set their availability, next to it */
  private readonly editAvailabilityControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('edit-availability') }),
  );
  /** Only there when the current user has not set their availability */
  private readonly addAvailabilityControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('add-availability') }),
  );

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  /** Whether the current user has set their availability */
  async hasAvailability(): Promise<boolean> {
    return (await this.availabilityStatus()) !== null;
  }

  /** Whether the control to change the availability is there, which it is once it is set */
  async hasEditAvailability(): Promise<boolean> {
    return (await this.editAvailabilityControl()) !== null;
  }

  /** Whether the control to add the availability is there, which it is until it is set */
  async hasAddAvailability(): Promise<boolean> {
    return (await this.addAvailabilityControl()) !== null;
  }

  /** Expands the card for the availability to be added or changed, or collapses it again */
  async toggleAvailabilityEditing(): Promise<void> {
    const control =
      (await this.editAvailabilityControl()) ??
      (await this.addAvailabilityControl());
    assert(control, NO_EDIT_CONTROL_MESSAGE);
    const wasExpanded = await this.isExpanded();

    await control.click();

    assert(
      (await this.isExpanded()) !== wasExpanded,
      EDITING_NOT_TOGGLED_MESSAGE,
    );
  }
}
