import { ComponentHarness } from '@angular/cdk/testing';

const TITLE_SELECTOR = '.title';

export class HeaderHarness extends ComponentHarness {
  static hostSelector = 'lib-header';

  private readonly title = this.locatorFor(TITLE_SELECTOR);

  async getTitle(): Promise<string> {
    const title = await this.title();
    return title.text();
  }
}
