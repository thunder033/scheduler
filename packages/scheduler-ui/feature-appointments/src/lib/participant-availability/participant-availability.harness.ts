import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { AvailabilityStatus } from '@org/models';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilityDotHarness } from '../availability-dot/availability-dot.harness';

const NO_CONFIRM_CONTROL_MESSAGE = 'The participant cannot be confirmed';
const CONFIRMATION_NOT_TOGGLED_MESSAGE =
  'The control did not confirm or unconfirm the participant';

export interface ParticipantAvailabilityHarnessFilters extends BaseHarnessFilters {
  /** The name of the participant */
  name?: string | RegExp;
}

export class ParticipantAvailabilityHarness extends ComponentHarness {
  static hostSelector = 'lib-participant-availability';

  static with(
    options: ParticipantAvailabilityHarnessFilters = {},
  ): HarnessPredicate<ParticipantAvailabilityHarness> {
    return new HarnessPredicate(
      ParticipantAvailabilityHarness,
      options,
    ).addOption('name', options.name, (harness, name) =>
      HarnessPredicate.stringMatches(harness.getName(), name),
    );
  }

  private readonly name = this.locatorFor(qaSelector('name'));
  private readonly dot = this.locatorFor(AvailabilityDotHarness);
  /** Only there while the participant can be confirmed */
  private readonly confirmControl = this.locatorForOptional(MatCheckboxHarness);
  /** Only there for a confirmed participant, while they cannot be confirmed */
  private readonly confirmedMark = this.locatorForOptional(
    qaSelector('confirmed'),
  );

  private readonly statusTooltip = this.locatorFor(
    MatTooltipHarness.with({ selector: qaSelector('status') }),
  );
  private readonly confirmedTooltip = this.locatorForOptional(
    MatTooltipHarness.with({ selector: qaSelector('confirmed') }),
  );

  async getName(): Promise<string> {
    return (await this.name()).text();
  }

  /** The text of the tooltip of the dot, which says what its color stands for */
  async getStatusTooltip(): Promise<string> {
    return this.readTooltip(await this.statusTooltip());
  }

  /** The text of the tooltip of the mark of a confirmed participant, or null when there is no mark */
  async getConfirmedTooltip(): Promise<string | null> {
    const tooltip = await this.confirmedTooltip();
    return tooltip ? this.readTooltip(tooltip) : null;
  }

  private async readTooltip(tooltip: MatTooltipHarness): Promise<string> {
    await tooltip.show();
    const text = await tooltip.getTooltipText();
    await tooltip.hide();
    return text;
  }

  /** The status the dot of the participant stands for */
  async getStatus(): Promise<AvailabilityStatus> {
    return (await this.dot()).getStatus();
  }

  /** Whether the participant can be confirmed, which is when there is a control for it */
  async hasConfirmControl(): Promise<boolean> {
    return (await this.confirmControl()) !== null;
  }

  /** Whether the control to confirm the participant is there, but cannot be changed */
  async isConfirmDisabled(): Promise<boolean> {
    const control = await this.confirmControl();
    assert(control, NO_CONFIRM_CONTROL_MESSAGE);
    return control.isDisabled();
  }

  async isConfirmed(): Promise<boolean> {
    const control = await this.confirmControl();
    return control
      ? control.isChecked()
      : (await this.confirmedMark()) !== null;
  }

  /** Confirms the participant, or if they are, takes the confirmation back */
  async toggleConfirmed(): Promise<void> {
    const control = await this.confirmControl();
    assert(control, NO_CONFIRM_CONTROL_MESSAGE);
    const wasConfirmed = await control.isChecked();

    await control.toggle();

    assert(
      (await control.isChecked()) !== wasConfirmed,
      CONFIRMATION_NOT_TOGGLED_MESSAGE,
    );
  }
}
