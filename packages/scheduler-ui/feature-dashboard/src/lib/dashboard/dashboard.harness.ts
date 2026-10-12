import { ComponentHarness } from '@angular/cdk/testing';
import { HeaderHarness } from '../header/header.harness';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  private readonly header = this.locatorForOptional(HeaderHarness);

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }

  async hasHeader(): Promise<boolean> {
    return (await this.header()) !== null;
  }
}
