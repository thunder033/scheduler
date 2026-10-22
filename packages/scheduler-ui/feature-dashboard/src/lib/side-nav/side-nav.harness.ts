import { ComponentHarness } from '@angular/cdk/testing';
import { MatNavListItemHarness } from '@angular/material/list/testing';
import { MatSidenavHarness } from '@angular/material/sidenav/testing';
import { qaSelector } from '@scheduler/ui/test-utils';
import { CurrentUserTileHarness } from '../current-user-tile/current-user-tile.harness';
import { ThemeMenuHarness } from '../theme-menu/theme-menu.harness';

const COLLAPSED_CLASS = 'collapsed';
const MISSING_COLLAPSE_TOGGLE_MESSAGE =
  'The sidebar can only be collapsed on wide screens';
const MISSING_TOGGLE_MESSAGE =
  'The navigation toggle is only there on narrow screens';

export class SideNavHarness extends ComponentHarness {
  static hostSelector = 'sch-side-nav';

  currentUserTile = this.locatorFor(CurrentUserTileHarness);
  themeMenu = this.locatorFor(ThemeMenuHarness);
  private readonly sidenav = this.locatorFor(MatSidenavHarness);
  private readonly title = this.locatorFor(qaSelector('title'));
  /** Only there on narrow screens */
  private readonly navigationToggle = this.locatorForOptional(
    qaSelector('navigation-toggle'),
  );

  /** Only there on wide screens */
  private readonly collapseToggle = this.locatorForOptional(
    qaSelector('collapse-toggle'),
  );

  /** The labels of the navigation items, in display order */
  async getNavigationLabels(): Promise<string[]> {
    const items = await this.locatorForAll(MatNavListItemHarness)();
    return Promise.all(items.map((item) => item.getTitle()));
  }

  async navigateTo(label: string): Promise<void> {
    const item = await this.locatorFor(
      MatNavListItemHarness.with({ title: label }),
    )();
    return item.click();
  }

  async getTitle(): Promise<string> {
    return (await this.title()).text();
  }

  async isOpen(): Promise<boolean> {
    return (await this.sidenav()).isOpen();
  }

  async isCollapsed(): Promise<boolean> {
    return (await (await this.sidenav()).host()).hasClass(COLLAPSED_CLASS);
  }

  async hasCollapseToggle(): Promise<boolean> {
    return (await this.collapseToggle()) !== null;
  }

  async toggleCollapsed(): Promise<void> {
    const toggle = await this.collapseToggle();
    assert(toggle, MISSING_COLLAPSE_TOGGLE_MESSAGE);
    return toggle.click();
  }

  async hasNavigationToggle(): Promise<boolean> {
    return (await this.navigationToggle()) !== null;
  }

  async togglePanel(): Promise<void> {
    const toggle = await this.navigationToggle();
    assert(toggle, MISSING_TOGGLE_MESSAGE);
    return toggle.click();
  }
}
