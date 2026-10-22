import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { qaSelector } from '@scheduler/ui/test-utils';

export class DeleteTimeslotDialogHarness extends ComponentHarness {
  static hostSelector = 'lib-delete-timeslot-dialog';

  private readonly confirmControl = this.locatorFor(
    MatButtonHarness.with({ selector: qaSelector('confirm-delete') }),
  );
  private readonly cancelControl = this.locatorFor(
    MatButtonHarness.with({ selector: qaSelector('cancel-delete') }),
  );

  async confirm(): Promise<void> {
    return (await this.confirmControl()).click();
  }

  async cancel(): Promise<void> {
    return (await this.cancelControl()).click();
  }
}
