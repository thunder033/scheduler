import { ComponentHarness } from '@angular/cdk/testing';
import { qaSelector } from '@scheduler/ui/test-utils';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  private readonly welcome = this.locatorFor(qaSelector('welcome'));

  async getWelcomeMessage(): Promise<string> {
    return (await this.welcome()).text();
  }
}
