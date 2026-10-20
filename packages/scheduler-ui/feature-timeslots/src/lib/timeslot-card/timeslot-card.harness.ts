import { BaseHarnessFilters, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { ExpandableCardHarness } from '@org/scheduler-ui/core-ui/testing';
import { DeleteTimeslotDialogHarness } from '../delete-timeslot-dialog/delete-timeslot-dialog.harness';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { timeslotCardId } from './timeslot-card.component';

export const CARD_HEADER_SELECTOR = qaSelector('card-header');
const IS_CONNECTED_PROPERTY = 'isConnected';
const NOT_EDITING_MESSAGE = 'The timeslot is not being edited';
const CANNOT_DELETE_MESSAGE =
  'The timeslot is not being edited, or is not created yet';
const NO_DELETE_CONFIRMATION_MESSAGE =
  'Asking to delete did not show the confirmation';
const NO_DELETE_REQUEST_MESSAGE = 'No deletion is waiting to be confirmed';
const NO_TIME_INPUT_MESSAGE = 'The time field has no input';
const EDITING_NOT_STARTED_MESSAGE = 'Toggling did not start the editing';
const EDITING_NOT_STOPPED_MESSAGE = 'Toggling did not stop the editing';
const SAVE_KEPT_EDITING_MESSAGE =
  'Saving did not stop the editing, so the changes may not be saveable';
const CONFIRMATION_STILL_OPEN_MESSAGE = 'The confirmation did not close';

export interface TimeslotTimes {
  start: string;
  end: string;
}

type TimeField = 'start' | 'end';

export interface TimeslotCardHarnessFilters extends BaseHarnessFilters {
  /** The id of the timeslot, which is empty for the new timeslot */
  timeslotId?: string;
  /** The time range the card shows, or the label of the new timeslot */
  timeRange?: string | RegExp;
}

export class TimeslotCardHarness extends ExpandableCardHarness {
  static hostSelector = 'lib-timeslot-card';

  static with(
    options: TimeslotCardHarnessFilters = {},
  ): HarnessPredicate<TimeslotCardHarness> {
    return new HarnessPredicate(TimeslotCardHarness, options)
      .addOption(
        'timeslotId',
        options.timeslotId,
        async (harness, timeslotId) =>
          (await (await harness.host()).getAttribute('id')) ===
          timeslotCardId(timeslotId),
      )
      .addOption('timeRange', options.timeRange, (harness, timeRange) =>
        HarnessPredicate.stringMatches(harness.getTimeRange(), timeRange),
      );
  }

  private readonly timeRange = this.locatorFor(qaSelector('time-range'));
  private readonly editToggle = this.locatorFor(
    MatButtonHarness.with({ selector: qaSelector('edit-toggle') }),
  );
  // The rest is only there while the timeslot is being edited
  /** Goes as soon as the editing stops, whereas the editor collapses first */
  private readonly dragHandle = this.locatorForOptional(
    qaSelector('drag-handle'),
  );
  private readonly startField = this.locatorForOptional(
    MatFormFieldHarness.with({ selector: qaSelector('start-time') }),
  );
  private readonly endField = this.locatorForOptional(
    MatFormFieldHarness.with({ selector: qaSelector('end-time') }),
  );
  private readonly saveControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('save') }),
  );
  /** Not there for a timeslot that is not created yet */
  private readonly deleteControl = this.locatorForOptional(
    MatButtonHarness.with({ selector: qaSelector('delete') }),
  );
  /** The confirmation is shown in an overlay, outside of the card */
  private readonly deleteConfirmation =
    this.documentRootLocatorFactory().locatorForOptional(
      DeleteTimeslotDialogHarness,
    );

  async getTimeRange(): Promise<string> {
    return (await this.timeRange()).text();
  }

  async toggleEditing(): Promise<void> {
    const wasEditing = await this.hasDragHandle();

    await (await this.editToggle()).click();

    if (wasEditing) {
      assert(await this.hasStoppedEditing(), EDITING_NOT_STOPPED_MESSAGE);
    } else {
      assert(await this.hasDragHandle(), EDITING_NOT_STARTED_MESSAGE);
    }
  }

  async isEditing(): Promise<boolean> {
    return (await this.startField()) !== null;
  }

  async hasDragHandle(): Promise<boolean> {
    return (await this.dragHandle()) !== null;
  }

  async setStartTime(time: string): Promise<void> {
    return (await this.getInput('start')).setValue(time);
  }

  async setEndTime(time: string): Promise<void> {
    return (await this.getInput('end')).setValue(time);
  }

  async setTimes({ start, end }: TimeslotTimes): Promise<void> {
    await this.setStartTime(start);
    await this.setEndTime(end);
  }

  async getStartTime(): Promise<string> {
    return (await this.getInput('start')).getValue();
  }

  async getEndTime(): Promise<string> {
    return (await this.getInput('end')).getValue();
  }

  async hasStartTimeError(): Promise<boolean> {
    return (await this.getField('start')).hasErrors();
  }

  async hasEndTimeError(): Promise<boolean> {
    return (await this.getField('end')).hasErrors();
  }

  async save(): Promise<void> {
    const saveControl = await this.saveControl();
    assert(saveControl, NOT_EDITING_MESSAGE);

    await saveControl.click();

    assert(await this.hasStoppedEditing(), SAVE_KEPT_EDITING_MESSAGE);
  }

  async canSave(): Promise<boolean> {
    const saveControl = await this.saveControl();
    assert(saveControl, NOT_EDITING_MESSAGE);

    return !(await saveControl.isDisabled());
  }

  /** Whether the timeslot can be deleted, which is not so for one that is not created yet */
  async canDelete(): Promise<boolean> {
    return (await this.deleteControl()) !== null;
  }

  /** Asks to delete the timeslot, which has to be confirmed in the dialog this returns */
  async requestDelete(): Promise<DeleteTimeslotDialogHarness> {
    const deleteControl = await this.deleteControl();
    assert(deleteControl, CANNOT_DELETE_MESSAGE);

    await deleteControl.click();

    const confirmation = await this.deleteConfirmation();
    assert(confirmation, NO_DELETE_CONFIRMATION_MESSAGE);

    return confirmation;
  }

  async isConfirmingDelete(): Promise<boolean> {
    return (await this.deleteConfirmation()) !== null;
  }

  async confirmDelete(): Promise<void> {
    const confirmation = await this.deleteConfirmation();
    assert(confirmation, NO_DELETE_REQUEST_MESSAGE);

    await confirmation.confirm();

    assert(!(await this.isConfirmingDelete()), CONFIRMATION_STILL_OPEN_MESSAGE);
  }

  async cancelDelete(): Promise<void> {
    const confirmation = await this.deleteConfirmation();
    assert(confirmation, NO_DELETE_REQUEST_MESSAGE);

    await confirmation.cancel();

    assert(!(await this.isConfirmingDelete()), CONFIRMATION_STILL_OPEN_MESSAGE);
  }

  /** Deletes the timeslot, confirming the deletion */
  async delete(): Promise<void> {
    await this.requestDelete();
    return this.confirmDelete();
  }

  /**
   * Whether the drag handle is gone, or the whole card is, as it is when a new timeslot stops being
   * edited or a moved timeslot returns to its day, since the card is removed along with its handle
   */
  private async hasStoppedEditing(): Promise<boolean> {
    const host = await this.host();
    const attached = await host.getProperty<boolean>(IS_CONNECTED_PROPERTY);
    return !attached || !(await this.hasDragHandle());
  }

  private async getField(name: TimeField): Promise<MatFormFieldHarness> {
    const field = await (name === 'start'
      ? this.startField()
      : this.endField());
    assert(field, NOT_EDITING_MESSAGE);

    return field;
  }

  private async getInput(name: TimeField): Promise<MatInputHarness> {
    const field = await this.getField(name);
    const input = await field.getControl(MatInputHarness);
    assert(input, NO_TIME_INPUT_MESSAGE);

    return input;
  }
}
