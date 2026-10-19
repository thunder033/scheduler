import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

export const DELETE_TIMESLOT_TITLE = 'Delete timeslot?';

export interface DeleteTimeslotDialogData {
  /** Identifies the timeslot being deleted, such as its time range */
  timeRange: string;
}

/** Closes with `true` when the deletion is confirmed, and `false` when it is cancelled */
@Component({
  selector: 'lib-delete-timeslot-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
  ],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      The timeslot {{ data.timeRange }} will be deleted along with its
      appointments. This can't be undone.
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button qa-cancel-delete [mat-dialog-close]="false">
        Cancel
      </button>
      <button mat-flat-button qa-confirm-delete [mat-dialog-close]="true">
        Delete
      </button>
    </mat-dialog-actions>
  `,
})
export class DeleteTimeslotDialogComponent {
  protected readonly data = inject<DeleteTimeslotDialogData>(MAT_DIALOG_DATA);
  protected readonly title = DELETE_TIMESLOT_TITLE;
}
