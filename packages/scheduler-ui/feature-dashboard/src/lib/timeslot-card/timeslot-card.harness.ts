import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { qaSelector } from '../../test-utils/qa-selector';

const TIME_RANGE_SELECTOR = qaSelector('time-range');
const EDIT_TOGGLE_SELECTOR = qaSelector('edit-toggle');
const START_TIME_SELECTOR = qaSelector('start-time');
const END_TIME_SELECTOR = qaSelector('end-time');

export class TimeslotCardHarness extends ComponentHarness {
  static hostSelector = 'lib-timeslot-card';

  private readonly timeRange = this.locatorFor(TIME_RANGE_SELECTOR);
  private readonly editToggle = this.locatorFor(
    MatButtonHarness.with({ selector: EDIT_TOGGLE_SELECTOR }),
  );
  private readonly startField = this.locatorFor(
    MatFormFieldHarness.with({ selector: START_TIME_SELECTOR }),
  );
  private readonly endField = this.locatorFor(
    MatFormFieldHarness.with({ selector: END_TIME_SELECTOR }),
  );
  private readonly optionalStartField = this.locatorForOptional(
    MatFormFieldHarness.with({ selector: START_TIME_SELECTOR }),
  );

  async getTimeRange(): Promise<string> {
    const timeRange = await this.timeRange();
    return timeRange.text();
  }

  async toggleEditing(): Promise<void> {
    const editToggle = await this.editToggle();
    await editToggle.click();
  }

  async isEditing(): Promise<boolean> {
    return (await this.optionalStartField()) !== null;
  }

  async setStartTime(time: string): Promise<void> {
    await this.setTime(await this.startField(), time);
  }

  async setEndTime(time: string): Promise<void> {
    await this.setTime(await this.endField(), time);
  }

  async getStartTime(): Promise<string> {
    return this.getTime(await this.startField());
  }

  async getEndTime(): Promise<string> {
    return this.getTime(await this.endField());
  }

  async hasStartTimeError(): Promise<boolean> {
    return (await this.startField()).hasErrors();
  }

  async hasEndTimeError(): Promise<boolean> {
    return (await this.endField()).hasErrors();
  }

  private async setTime(field: MatFormFieldHarness, time: string) {
    const input = await field.getControl(MatInputHarness);
    await input?.setValue(time);
  }

  private async getTime(field: MatFormFieldHarness): Promise<string> {
    const input = await field.getControl(MatInputHarness);
    return (await input?.getValue()) ?? '';
  }
}
