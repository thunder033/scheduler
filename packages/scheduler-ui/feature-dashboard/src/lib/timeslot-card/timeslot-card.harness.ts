import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { qaSelector } from '../../test-utils/qa-selector';
import {
  EDITOR_COLLAPSE_CLASS,
  EDITOR_EXPAND_CLASS,
  timeslotCardId,
} from './timeslot-card.component';

export const CARD_HEADER_SELECTOR = qaSelector('card-header');
export const EDITOR_SELECTOR = qaSelector('editor');
const DRAG_HANDLE_SELECTOR = qaSelector('drag-handle');
const TIME_RANGE_SELECTOR = qaSelector('time-range');
const EDIT_TOGGLE_SELECTOR = qaSelector('edit-toggle');
const SAVE_SELECTOR = qaSelector('save');
const START_TIME_SELECTOR = qaSelector('start-time');
const END_TIME_SELECTOR = qaSelector('end-time');

export interface TimeslotCardHarnessFilters extends BaseHarnessFilters {
  timeslotId: string;
}

export class TimeslotCardHarness extends ComponentHarness {
  static hostSelector = 'lib-timeslot-card';

  /** Finds the card of the timeslot with the id, whose card is the new timeslot's when it is empty */
  static with(
    options: TimeslotCardHarnessFilters,
  ): HarnessPredicate<TimeslotCardHarness> {
    return new HarnessPredicate(TimeslotCardHarness, options).addOption(
      'timeslotId',
      options.timeslotId,
      async (harness, timeslotId) =>
        (await (await harness.host()).getAttribute('id')) ===
        timeslotCardId(timeslotId),
    );
  }

  private readonly timeRange = this.locatorFor(TIME_RANGE_SELECTOR);
  private readonly editToggle = this.locatorFor(
    MatButtonHarness.with({ selector: EDIT_TOGGLE_SELECTOR }),
  );
  private readonly saveControl = this.locatorFor(
    MatButtonHarness.with({ selector: SAVE_SELECTOR }),
  );
  private readonly startField = this.locatorFor(
    MatFormFieldHarness.with({ selector: START_TIME_SELECTOR }),
  );
  private readonly endField = this.locatorFor(
    MatFormFieldHarness.with({ selector: END_TIME_SELECTOR }),
  );
  private readonly optionalEditor = this.locatorForOptional(EDITOR_SELECTOR);
  private readonly optionalDragHandle =
    this.locatorForOptional(DRAG_HANDLE_SELECTOR);
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

  async hasDragHandle(): Promise<boolean> {
    return (await this.optionalDragHandle()) !== null;
  }

  /** Whether the editor is playing its expand or collapse animation */
  async isEditorAnimating(): Promise<boolean> {
    const editor = await this.optionalEditor();
    return (
      (await editor?.hasClass(EDITOR_EXPAND_CLASS)) ||
      (await editor?.hasClass(EDITOR_COLLAPSE_CLASS)) ||
      false
    );
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

  async save(): Promise<void> {
    const saveControl = await this.saveControl();
    await saveControl.click();
  }

  async canSave(): Promise<boolean> {
    return !(await (await this.saveControl()).isDisabled());
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
