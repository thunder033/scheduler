import { ComponentHarness } from '@angular/cdk/testing';
import { CurrentUserTileHarness } from '../current-user-tile/current-user-tile.harness';
import { ThemeMenuHarness } from '../theme-menu/theme-menu.harness';

const TITLE_SELECTOR = '.title';

export class HeaderHarness extends ComponentHarness {
  static hostSelector = 'lib-header';

  currentUserTile = this.locatorFor(CurrentUserTileHarness);
  themeMenu = this.locatorFor(ThemeMenuHarness);
  private readonly title = this.locatorFor(TITLE_SELECTOR);

  async getTitle(): Promise<string> {
    const title = await this.title();
    return title.text();
  }
}
