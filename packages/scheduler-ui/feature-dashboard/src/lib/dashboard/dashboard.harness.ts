import { ComponentHarness } from '@angular/cdk/testing';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
