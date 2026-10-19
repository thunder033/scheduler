import { inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import {
  Actions,
  ofActionCompleted,
  ofActionDispatched,
  ofActionErrored,
} from '@ngxs/store';
import {
  ConfirmMember,
  CreateAppointment,
  CreateTimeslot,
  DeleteTimeslot,
  LoadAppointmentsByWeek,
  LoadTimeslots,
  RemoveAvailability,
  RemoveProspect,
  SetAvailability,
  SetProspect,
  UnconfirmMember,
  UpdateTimeslot,
} from '@org/scheduler-ui/state';

export const SAVING_MESSAGE = 'Saving changes...';
export const SAVED_MESSAGE = 'Changes saved';
export const SAVED_DURATION_MS = 3000;
export const DISMISS_LABEL = 'Dismiss';
export const UNKNOWN_ERROR_MESSAGE = 'Something went wrong';
export const ERROR_DURATION_MS = 8000;

/** Actions that change data, as opposed to loading it */
const SAVE_ACTIONS = [
  CreateTimeslot,
  UpdateTimeslot,
  DeleteTimeslot,
  CreateAppointment,
  SetAvailability,
  RemoveAvailability,
  SetProspect,
  RemoveProspect,
  ConfirmMember,
  UnconfirmMember,
];

const API_ACTIONS = [LoadTimeslots, LoadAppointmentsByWeek, ...SAVE_ACTIONS];

/** Tells the user when planning changes are being saved or were saved, and when an operation fails */
@Injectable({
  providedIn: 'root',
})
export class PlanningFeedbackService {
  private readonly snackBar = inject(MatSnackBar);
  private pendingSaves = 0;
  /** Whether a save has failed since the saves last all finished */
  private hasFailedSave = false;
  private savingSnackBar: MatSnackBarRef<unknown> | null = null;

  constructor() {
    const actions = inject(Actions);

    actions
      .pipe(ofActionDispatched(...SAVE_ACTIONS), takeUntilDestroyed())
      .subscribe(() => this.saveStarted());
    actions
      .pipe(ofActionCompleted(...SAVE_ACTIONS), takeUntilDestroyed())
      .subscribe(({ result }) => this.saveFinished(result.successful));
    actions
      .pipe(ofActionErrored(...API_ACTIONS), takeUntilDestroyed())
      .subscribe(({ result }) => this.showError(result.error));
  }

  private saveStarted(): void {
    this.pendingSaves++;
    this.savingSnackBar ??= this.snackBar.open(SAVING_MESSAGE);
  }

  private saveFinished(successful: boolean): void {
    this.pendingSaves--;
    this.hasFailedSave ||= !successful;

    if (this.pendingSaves === 0) {
      this.savingSnackBar?.dismiss();
      this.savingSnackBar = null;
      if (!this.hasFailedSave) {
        this.snackBar.open(SAVED_MESSAGE, undefined, {
          duration: SAVED_DURATION_MS,
        });
      }
      this.hasFailedSave = false;
    }
  }

  private showError(error: unknown): void {
    const message =
      error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
    this.snackBar.open(message, DISMISS_LABEL, { duration: ERROR_DURATION_MS });
    this.savingSnackBar = null;
  }
}
