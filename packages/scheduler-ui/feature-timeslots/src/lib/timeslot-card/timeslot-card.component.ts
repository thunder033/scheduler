import { CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  AnimationCallbackEvent,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  untracked,
} from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { Store } from '@ngxs/store';
import { Timeslot } from '@scheduler/models';
import { ExpandableCard } from '@scheduler/ui/core-ui';
import {
  CreateTimeslot,
  DeleteTimeslot,
  NEW_TIMESLOT,
  PlanningState,
  StartEditingTimeslot,
  StopEditingTimeslot,
  UpdateTimeslot,
  UpdateEditingTimeslot,
} from '@scheduler/ui/state';

import {
  DeleteTimeslotDialogComponent,
  DeleteTimeslotDialogData,
} from '../delete-timeslot-dialog/delete-timeslot-dialog.component';
import { filter, switchMap } from 'rxjs';

const TIME_RANGE_SEPARATOR = ' – ';
const TIME_RANGE_ERROR_KIND = 'timeRange';

/** Class that plays the matching keyframes in the component styles */
const HANDLE_WIPE_IN_CLASS = 'handle-wipe-in';

const TIMESLOT_CARD_ID_PREFIX = 'timeslot-card-';
export const NEW_TIMESLOT_LABEL = 'New timeslot';
export const EDIT_TIMESLOT_LABEL = 'Edit timeslot';
export const DELETE_TIMESLOT_LABEL = 'Delete timeslot';
export const REQUIRED_TIME_MESSAGE = 'Required';
export const INVALID_TIME_RANGE_MESSAGE = 'Start must be before end';

/** The id of the element of the card for the timeslot, which is unique among the cards */
export function timeslotCardId(timeslotId: string): string {
  return `${TIMESLOT_CARD_ID_PREFIX}${timeslotId}`;
}

export function formatTimeRange({
  start,
  end,
}: Pick<Timeslot, 'start' | 'end'>): string {
  return `${start}${TIME_RANGE_SEPARATOR}${end}`;
}

@Component({
  selector: 'lib-timeslot-card',
  imports: [
    CdkDragHandle,
    FormField,
    MatButton,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
  ],
  templateUrl: './timeslot-card.component.html',
  styleUrl: './timeslot-card.component.scss',
  host: { '[id]': 'elementId()' },
})
export class TimeslotCardComponent extends ExpandableCard {
  private readonly store = inject(Store);
  private readonly dialog = inject(MatDialog);

  readonly timeslot = input.required<Timeslot>();

  protected readonly editLabel = EDIT_TIMESLOT_LABEL;
  protected readonly deleteLabel = DELETE_TIMESLOT_LABEL;
  /** Only flags a time once the user has changed it, so untouched fields stay calm */
  protected readonly errorMatcher = new ShowOnDirtyErrorStateMatcher();
  protected readonly isNew = computed(
    () => this.timeslot().timeslotId === NEW_TIMESLOT.timeslotId,
  );
  protected readonly elementId = computed(() =>
    timeslotCardId(this.timeslot().timeslotId),
  );
  protected readonly timeRange = computed(() =>
    this.isNew() ? NEW_TIMESLOT_LABEL : formatTimeRange(this.timeslot()),
  );
  private readonly editingTimeslot = this.store.selectSignal(
    PlanningState.editingTimeslot,
  );
  /** The saved times, with any unsaved changes kept in the state while this timeslot is edited */
  private readonly currentTimes = computed(() => ({
    ...this.timeslot(),
    ...(this.editing() ? this.editingTimeslot() : undefined),
  }));
  /**
   * Whether the times are being edited, which also lets the card be dragged to another day.
   * This is kept in the state because the card is recreated when it moves to another day.
   */
  protected readonly editing = computed(
    () => this.editingTimeslot()?.timeslotId === this.timeslot().timeslotId,
  );
  /** The card expands for the editing */
  readonly expanded = this.editing;

  /**
   * The times being edited, which start from the changes kept in the state while editing, so they
   * survive the card being recreated, and start over whenever the timeslot changes
   */
  private readonly times = linkedSignal(() => {
    const { start, end } = this.currentTimes();
    return { start, end };
  });
  protected readonly timesForm = form(this.times, (path) => {
    required(path.start, { message: REQUIRED_TIME_MESSAGE });
    required(path.end, { message: REQUIRED_TIME_MESSAGE });
    validate(path.start, ({ value, valueOf }) =>
      value() && valueOf(path.end) && value() >= valueOf(path.end)
        ? { kind: TIME_RANGE_ERROR_KIND, message: INVALID_TIME_RANGE_MESSAGE }
        : undefined,
    );
    validate(path.end, ({ value, valueOf }) =>
      value() && valueOf(path.start) && value() <= valueOf(path.start)
        ? { kind: TIME_RANGE_ERROR_KIND, message: INVALID_TIME_RANGE_MESSAGE }
        : undefined,
    );
  });

  /** Whether the times differ from the saved ones, and can be saved since they are valid */
  protected readonly canSave = computed(() => {
    const { start, end } = this.times();
    const saved = this.timeslot();
    const { dayOfWeek } = this.currentTimes();
    const changed =
      start !== saved.start ||
      end !== saved.end ||
      dayOfWeek !== saved.dayOfWeek;
    // A new timeslot also needs the day it is dragged to
    const hasDay = dayOfWeek !== NEW_TIMESLOT.dayOfWeek;
    return changed && hasDay && this.timesForm().valid();
  });

  constructor() {
    super();
    effect(() => this.keepDraft());
    // Times that were never saved don't outlive the editing, however it ends
    effect(() => {
      if (!this.editing()) {
        untracked(() => this.discardChanges());
      }
    });
  }

  protected toggleEditing(): void {
    this.store.dispatch(
      this.editing()
        ? new StopEditingTimeslot()
        : new StartEditingTimeslot(this.timeslot().timeslotId),
    );
  }

  protected wipeInHandle(event: AnimationCallbackEvent): void {
    this.playIfRendered(event, HANDLE_WIPE_IN_CLASS);
  }

  /** Deletes the timeslot once the user confirms it, since that can't be undone */
  protected confirmDelete(): void {
    this.dialog
      .open<DeleteTimeslotDialogComponent, DeleteTimeslotDialogData, boolean>(
        DeleteTimeslotDialogComponent,
        { data: { timeRange: this.timeRange() } },
      )
      .afterClosed()
      .pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() =>
          this.store.dispatch(new DeleteTimeslot(this.timeslot().timeslotId)),
        ),
      )
      .subscribe({ error: undefined }); // error reported by planning feedback
  }

  protected save(): void {
    if (!this.canSave()) {
      return;
    }

    const { start, end } = this.times();
    const { dayOfWeek } = this.currentTimes();
    const saving = this.isNew()
      ? new CreateTimeslot({ start, end, dayOfWeek })
      : new UpdateTimeslot(this.timeslot().timeslotId, {
          start,
          end,
          dayOfWeek,
        });
    this.store.dispatch(saving).subscribe({
      complete: () => this.store.dispatch(new StopEditingTimeslot()),
      // A failed save keeps the editing open, and is reported by the planning feedback
      error: () => undefined,
    });
  }

  private keepDraft(): void {
    const { start, end } = this.times();
    const kept = untracked(this.currentTimes);

    if (this.editing() && (start !== kept.start || end !== kept.end)) {
      untracked(() =>
        this.store.dispatch(new UpdateEditingTimeslot({ start, end })),
      );
    }
  }

  private discardChanges(): void {
    const { start, end } = this.timeslot();
    this.timesForm().reset({ start, end });
  }
}
