import { ComponentHarness } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { qaSelector } from '../../test-utils/qa-selector';

const CONFIRM_SELECTOR = qaSelector('confirm-delete');
const CANCEL_SELECTOR = qaSelector('cancel-delete');

export class DeleteTimeslotDialogHarness extends ComponentHarness {
  static hostSelector = 'lib-delete-timeslot-dialog';

  private readonly confirmControl = this.locatorFor(
    MatButtonHarness.with({ selector: CONFIRM_SELECTOR }),
  );
  private readonly cancelControl = this.locatorFor(
    MatButtonHarness.with({ selector: CANCEL_SELECTOR }),
  );

  async confirm(): Promise<void> {
    await (await this.confirmControl()).click();
  }

  async cancel(): Promise<void> {
    await (await this.cancelControl()).click();
  }
}
