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

/** Tells the user when planning changes are being saved, and when an operation fails */
@Injectable({
  providedIn: 'root',
})
export class PlanningFeedback {
  private readonly snackBar = inject(MatSnackBar);
  private pendingSaves = 0;
  private savingSnackBar: MatSnackBarRef<unknown> | null = null;

  constructor() {
    const actions = inject(Actions);

    actions
      .pipe(ofActionDispatched(...SAVE_ACTIONS), takeUntilDestroyed())
      .subscribe(() => this.saveStarted());
    actions
      .pipe(ofActionCompleted(...SAVE_ACTIONS), takeUntilDestroyed())
      .subscribe(() => this.saveFinished());
    actions
      .pipe(ofActionErrored(...API_ACTIONS), takeUntilDestroyed())
      .subscribe(({ result }) => this.showError(result.error));
  }

  private saveStarted(): void {
    this.pendingSaves++;
    this.savingSnackBar ??= this.snackBar.open(SAVING_MESSAGE);
  }

  private saveFinished(): void {
    this.pendingSaves--;
    if (this.pendingSaves === 0) {
      this.savingSnackBar?.dismiss();
      this.savingSnackBar = null;
    }
  }

  private showError(error: unknown): void {
    const message =
      error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE;
    this.snackBar.open(message, DISMISS_LABEL, { duration: ERROR_DURATION_MS });
    this.savingSnackBar = null;
  }
}
