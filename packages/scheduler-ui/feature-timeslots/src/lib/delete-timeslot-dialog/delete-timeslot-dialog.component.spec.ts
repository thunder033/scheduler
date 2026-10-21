import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  DeleteTimeslotDialogComponent,
  DeleteTimeslotDialogData,
} from './delete-timeslot-dialog.component';
import { DeleteTimeslotDialogHarness } from './delete-timeslot-dialog.harness';

/** Gives the harness environment a fixture, as the dialog itself is rendered in the overlay */
@Component({ template: '' })
class DialogScene {}

async function setup() {
  await TestBed.configureTestingModule({
    imports: [DeleteTimeslotDialogComponent, DialogScene],
  }).compileComponents();

  const data: DeleteTimeslotDialogData = { timeRange: '09:00 – 10:00' };
  const dialogRef = TestBed.inject(MatDialog).open(
    DeleteTimeslotDialogComponent,
    { data },
  );
  const result = firstValueFrom(dialogRef.afterClosed());
  const harness = await TestbedHarnessEnvironment.documentRootLoader(
    TestBed.createComponent(DialogScene),
  ).getHarness(DeleteTimeslotDialogHarness);

  return { harness, result };
}

describe('DeleteTimeslotDialogComponent', () => {
  it('closes as confirmed when the deletion is confirmed', async () => {
    const { harness, result } = await setup();

    await harness.confirm();

    expect(await result).toBe(true);
  });

  it('closes as not confirmed when the deletion is cancelled', async () => {
    const { harness, result } = await setup();

    await harness.cancel();

    expect(await result).toBe(false);
  });
});
