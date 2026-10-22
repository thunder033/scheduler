import { ComponentHarness } from '@angular/cdk/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { AvailabilityStatus } from '@scheduler/models';
import { AvailabilityDotHarness } from '../availability-dot/availability-dot.harness';

export class AvailabilitySelectHarness extends ComponentHarness {
  static hostSelector = 'sch-availability-select';

  private readonly field = this.locatorFor(MatFormFieldHarness);
  private readonly select = this.locatorFor(MatSelectHarness);
  /** The dot of the selected status, in the select, whereas the options are in an overlay */
  private readonly selectedDot = this.locatorForOptional(
    AvailabilityDotHarness,
  );

  /** The label of the field */
  async getLabel(): Promise<string | null> {
    return (await this.field()).getLabel();
  }

  /** The labels of the options, in display order */
  async getOptions(): Promise<string[]> {
    const select = await this.select();

    await select.open();
    const options = await select.getOptions();
    const labels = await Promise.all(options.map((option) => option.getText()));
    await select.close();
    return labels;
  }

  /** The statuses the dots of the options stand for, in display order */
  async getOptionStatuses(): Promise<AvailabilityStatus[]> {
    const select = await this.select();

    await select.open();
    const options = await select.getOptions();
    const statuses = await Promise.all(
      options.map(async (option) =>
        (await option.getHarness(AvailabilityDotHarness)).getStatus(),
      ),
    );
    await select.close();
    return statuses;
  }

  /** The status the dot of the selected option stands for, or null when nothing is selected */
  async getSelectedStatus(): Promise<AvailabilityStatus | null> {
    return (await this.selectedDot())?.getStatus() ?? null;
  }

  /** The placeholder, which is shown while nothing is selected, or null when something is */
  async getPlaceholder(): Promise<string | null> {
    const select = await this.select();
    return (await select.isEmpty()) ? select.getValueText() : null;
  }

  async isDisabled(): Promise<boolean> {
    return (await this.select()).isDisabled();
  }

  async selectOption(label: string): Promise<void> {
    return (await this.select()).clickOptions({ text: label });
  }
}
