import { ComponentHarness } from '@angular/cdk/testing';

const OWNER_DOCUMENT_PROPERTY = 'ownerDocument';

export class AppHarness extends ComponentHarness {
  static hostSelector = 'app-root';

  async getColorScheme(): Promise<string> {
    const { rootElement } = this.documentRootLocatorFactory();
    const document = await rootElement.getProperty<Document>(
      OWNER_DOCUMENT_PROPERTY,
    );
    return document.documentElement.style.colorScheme;
  }
}
