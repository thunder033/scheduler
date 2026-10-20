import { ComponentHarness } from '@angular/cdk/testing';
import { AvailabilityStatus } from '@org/models';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import { AvailabilityDotHarness } from '../availability-dot/availability-dot.harness';

export class MemberAvailabilityHarness extends ComponentHarness {
  static hostSelector = 'lib-member-availability';

  private readonly name = this.locatorFor(qaSelector('name'));
  private readonly dot = this.locatorFor(AvailabilityDotHarness);

  async getName(): Promise<string> {
    return (await this.name()).text();
  }

  /** The status the dot of the member stands for */
  async getStatus(): Promise<AvailabilityStatus> {
    return (await this.dot()).getStatus();
  }
}
