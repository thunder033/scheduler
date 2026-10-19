import { ComponentHarness } from '@angular/cdk/testing';
import { HeaderHarness } from '../header/header.harness';
import { TimeslotPlannerHarness } from '../timeslot-planner/timeslot-planner.harness';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  header = this.locatorFor(HeaderHarness);
  /** Only there for a coordinator */
  timeslotPlanner = this.locatorForOptional(TimeslotPlannerHarness);

  async getText(): Promise<string> {
    return (await this.host()).text();
  }

  async hasTimeslotPlanner(): Promise<boolean> {
    return (await this.timeslotPlanner()) !== null;
  }
}
