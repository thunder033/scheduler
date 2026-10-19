import { ComponentHarness } from '@angular/cdk/testing';
import { SideNavHarness } from '../side-nav/side-nav.harness';

export class ShellHarness extends ComponentHarness {
  static hostSelector = 'lib-shell';

  sideNav = this.locatorFor(SideNavHarness);
}
