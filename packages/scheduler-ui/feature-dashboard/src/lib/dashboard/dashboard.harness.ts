import { ComponentHarness } from '@angular/cdk/testing';
import { HeaderHarness } from '../header/header.harness';
import { TimeslotPlannerHarness } from '../timeslot-planner/timeslot-planner.harness';

export class DashboardHarness extends ComponentHarness {
  static hostSelector = 'lib-dashboard';

  header = this.locatorFor(HeaderHarness);
  timeslotPlanner = this.locatorFor(TimeslotPlannerHarness);
  private readonly optionalHeader = this.locatorForOptional(HeaderHarness);
  private readonly optionalTimeslotPlanner = this.locatorForOptional(
    TimeslotPlannerHarness,
  );

  async getText(): Promise<string> {
    const host = await this.host();
    return host.text();
  }

  async hasHeader(): Promise<boolean> {
    return (await this.optionalHeader()) !== null;
  }

  async hasTimeslotPlanner(): Promise<boolean> {
    return (await this.optionalTimeslotPlanner()) !== null;
  }
}
