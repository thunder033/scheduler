import { ComponentHarness } from '@angular/cdk/testing';
import { AvailabilityStatus } from '@scheduler/models';
import { qaSelector } from '@scheduler/ui/test-utils';
import { AvailabilityDotHarness } from '../availability-dot/availability-dot.harness';

export class AvailabilityStatusHarness extends ComponentHarness {
  static hostSelector = 'lib-availability-status';

  private readonly label = this.locatorFor(qaSelector('label'));
  private readonly dot = this.locatorFor(AvailabilityDotHarness);

  async getLabel(): Promise<string> {
    return (await this.label()).text();
  }

  /** The status the dot of the label stands for */
  async getStatus(): Promise<AvailabilityStatus> {
    return (await this.dot()).getStatus();
  }
}
