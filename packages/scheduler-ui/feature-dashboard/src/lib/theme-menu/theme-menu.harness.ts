import { ComponentHarness } from '@angular/cdk/testing';
import { MatMenuHarness } from '@angular/material/menu/testing';

const SELECTED_THEME_CLASS = 'selected';

export class ThemeMenuHarness extends ComponentHarness {
  static hostSelector = 'lib-theme-menu';

  private readonly menu = this.locatorFor(MatMenuHarness);

  async getSelectedTheme(): Promise<string | null> {
    const menu = await this.menu();
    await menu.open();
    const items = await menu.getItems();
    const selected = await Promise.all(
      items.map(async (item) => {
        const host = await item.host();
        return (await host.hasClass(SELECTED_THEME_CLASS))
          ? item.getText()
          : null;
      }),
    );
    await menu.close();
    return selected.find((theme) => theme !== null) ?? null;
  }

  async getThemes(): Promise<string[]> {
    const menu = await this.menu();
    await menu.open();
    const items = await menu.getItems();
    const themes = await Promise.all(items.map((item) => item.getText()));
    await menu.close();
    return themes;
  }

  async selectTheme(theme: string): Promise<void> {
    const menu = await this.menu();
    await menu.clickItem({ text: theme });
  }
}
