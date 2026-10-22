import { ComponentHarness } from '@angular/cdk/testing';
import { AvailabilityStatus } from '@scheduler/models';

const STATUS_ATTRIBUTE = 'data-status';
const UNKNOWN_STATUS_MESSAGE = 'The dot is not for a known availability status';

export class AvailabilityDotHarness extends ComponentHarness {
  static hostSelector = 'lib-availability-dot';

  /** The availability status the dot stands for */
  async getStatus(): Promise<AvailabilityStatus> {
    const value = await (await this.host()).getAttribute(STATUS_ATTRIBUTE);
    const status = Object.values(AvailabilityStatus).find(
      (known) => known === value,
    );
    assert(status, UNKNOWN_STATUS_MESSAGE);

    return status;
  }

  async hasColorClass(colorClass: string): Promise<boolean> {
    return (await this.host()).hasClass(colorClass);
  }
}
