import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilityStatusHarness } from '../availability-status/availability-status.harness';

export interface AppointmentCardHarnessFilters extends BaseHarnessFilters {
  /** The time range the card shows */
  timeRange?: string | RegExp;
}

export class AppointmentCardHarness extends ComponentHarness {
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

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  /** Whether the current user has set their availability */
  async hasAvailability(): Promise<boolean> {
    return (await this.availabilityStatus()) !== null;
  }
}
