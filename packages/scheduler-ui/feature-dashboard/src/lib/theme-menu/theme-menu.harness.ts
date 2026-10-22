import { ComponentHarness } from '@angular/cdk/testing';
import {
  MatMenuHarness,
  MatMenuItemHarness,
} from '@angular/material/menu/testing';

const SELECTED_THEME_CLASS = 'selected';

export class ThemeMenuHarness extends ComponentHarness {
  static hostSelector = 'sch-theme-menu';

  private readonly menu = this.locatorFor(MatMenuHarness);

  async getSelectedTheme(): Promise<string | null> {
    return this.readItems(async (items) => {
      for (const item of items) {
        if (await (await item.host()).hasClass(SELECTED_THEME_CLASS)) {
          return item.getText();
        }
      }
      return null;
    });
  }

  async getThemes(): Promise<string[]> {
    return this.readItems((items) =>
      Promise.all(items.map((item) => item.getText())),
    );
  }

  async selectTheme(theme: string): Promise<void> {
    return (await this.menu()).clickItem({ text: theme });
  }

  /** Reads the menu items, which are only there while the menu is open */
  private async readItems<T>(
    read: (items: MatMenuItemHarness[]) => Promise<T>,
  ): Promise<T> {
    const menu = await this.menu();
    await menu.open();
    const result = await read(await menu.getItems());
    await menu.close();
    return result;
  }
}
