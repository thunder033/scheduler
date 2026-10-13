import { ComponentHarness } from '@angular/cdk/testing';

const DISPLAY_NAME_SELECTOR = '.display-name';

export class CurrentUserTileHarness extends ComponentHarness {
  static hostSelector = 'lib-current-user-tile';

  private readonly displayName = this.locatorForOptional(DISPLAY_NAME_SELECTOR);

  async getDisplayName(): Promise<string | null> {
    const displayName = await this.displayName();
    return displayName ? displayName.text() : null;
  }
}
