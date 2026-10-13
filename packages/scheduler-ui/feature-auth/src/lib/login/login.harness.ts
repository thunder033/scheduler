import { ComponentHarness } from '@angular/cdk/testing';

export class LoginHarness extends ComponentHarness {
  static hostSelector = 'lib-login';

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }
}
