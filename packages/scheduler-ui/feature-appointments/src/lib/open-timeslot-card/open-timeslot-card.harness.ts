import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilitySelectHarness } from '../availability-select/availability-select.harness';

const IS_CONNECTED_PROPERTY = 'isConnected';
const NOT_ADDING_MESSAGE = 'No availability is being added';
const ALREADY_ADDING_MESSAGE = 'Availability is already being added';
const ADDING_NOT_STARTED_MESSAGE =
  'Adding availability did not show the availability options';
const SAVE_KEPT_ADDING_MESSAGE =
  'Saving did not finish adding availability, so it may not be saved';

export interface OpenTimeslotCardHarnessFilters extends BaseHarnessFilters {
  /** The time range the card shows */
  timeRange?: string | RegExp;
}

export class OpenTimeslotCardHarness extends ComponentHarness {
  static hostSelector = 'lib-open-timeslot-card';

  static with(
    options: OpenTimeslotCardHarnessFilters = {},
  ): HarnessPredicate<OpenTimeslotCardHarness> {
    return new HarnessPredicate(OpenTimeslotCardHarness, options).addOption(
      'timeRange',
      options.timeRange,
      (harness, timeRange) =>
        HarnessPredicate.stringMatches(harness.getTimeRange(), timeRange),
    );
  }

  /** Only there while availability is being added */
  availabilitySelect = this.locatorForOptional(AvailabilitySelectHarness);

  private readonly timeRange = this.locatorFor(qaSelector('time-range'));
  /** Only there until adding availability is started */
  private readonly addAvailabilityControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('add-availability') }),
  );
  private readonly saveControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('save-availability') }),
  );

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  /** Whether the control that starts adding availability is there */
  async hasAddAvailability(): Promise<boolean> {
    return (await this.addAvailabilityControl()) !== null;
  }

  /** Whether the availability options are shown, which is while availability is being added */
  async isAddingAvailability(): Promise<boolean> {
    return (await this.availabilitySelect()) !== null;
  }

  /** Shows the availability options in place of the control that starts adding */
  async startAddingAvailability(): Promise<void> {
    const control = await this.addAvailabilityControl();
    assert(control, ALREADY_ADDING_MESSAGE);
    await control.click();

    assert(await this.availabilitySelect(), ADDING_NOT_STARTED_MESSAGE);
  }

  async canSaveAvailability(): Promise<boolean> {
    const control = await this.saveControl();
    assert(control, NOT_ADDING_MESSAGE);

    return !(await control.isDisabled());
  }

  /**
   * Saves the selected availability, which brings back the control that starts adding, unless
   * the card is replaced by the appointment's, which is created by the first save
   */
  async saveAvailability(): Promise<void> {
    const control = await this.saveControl();
    assert(control, NOT_ADDING_MESSAGE);
    await control.click();

    // A card that was replaced is removed with its host, and its subtree stays in the detached host
    const replaced = !(await (
      await this.host()
    ).getProperty(IS_CONNECTED_PROPERTY));
    assert(
      replaced || !(await this.availabilitySelect()),
      SAVE_KEPT_ADDING_MESSAGE,
    );
  }
}
