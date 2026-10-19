import { ComponentHarness } from '@angular/cdk/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';

export class AppointmentsHarness extends ComponentHarness {
  static hostSelector = 'lib-appointments';

  private readonly title = this.locatorFor(qaSelector('title'));

  async getTitle(): Promise<string> {
    return (await this.title()).text();
  }
}
