import { ComponentHarness } from '@angular/cdk/testing';
import { qaSelector } from '../../test-utils/qa-selector';
import { CurrentUserTileHarness } from '../current-user-tile/current-user-tile.harness';
import { ThemeMenuHarness } from '../theme-menu/theme-menu.harness';

const TITLE_SELECTOR = qaSelector('title');

export class HeaderHarness extends ComponentHarness {
  static hostSelector = 'lib-header';

  currentUserTile = this.locatorFor(CurrentUserTileHarness);
  themeMenu = this.locatorFor(ThemeMenuHarness);
  private readonly title = this.locatorFor(TITLE_SELECTOR);

  async getTitle(): Promise<string> {
    return (await this.title()).text();
  }
}
