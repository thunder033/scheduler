import { ComponentHarness } from '@angular/cdk/testing';
import { HeaderHarness } from '../header/header.harness';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  header = this.locatorFor(HeaderHarness);
  private readonly optionalHeader = this.locatorForOptional(HeaderHarness);

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }

  async hasHeader(): Promise<boolean> {
    return (await this.optionalHeader()) !== null;
  }
}
