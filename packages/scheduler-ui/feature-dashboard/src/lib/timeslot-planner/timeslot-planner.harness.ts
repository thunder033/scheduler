import { ComponentHarness } from '@angular/cdk/testing';
import { TimeslotCardHarness } from '../timeslot-card/timeslot-card.harness';

const DAY_SELECTOR = '.day';
const DAY_LABEL_SELECTOR = '.day-label';
const DROP_TARGET_CLASS = 'cdk-drop-list-receiving';

class TimeslotPlannerDayHarness extends ComponentHarness {
  static hostSelector = DAY_SELECTOR;

  private readonly label = this.locatorFor(DAY_LABEL_SELECTOR);
  private readonly cards = this.locatorForAll(TimeslotCardHarness);

  async getLabel(): Promise<string> {
    const label = await this.label();
    return label.text();
  }

  async getTimeRanges(): Promise<string[]> {
    const cards = await this.cards();
    return Promise.all(cards.map((card) => card.getTimeRange()));
  }

  async isDropTarget(): Promise<boolean> {
    const host = await this.host();
    return host.hasClass(DROP_TARGET_CLASS);
  }
}

export class TimeslotPlannerHarness extends ComponentHarness {
  static hostSelector = 'lib-timeslot-planner';

  private readonly days = this.locatorForAll(TimeslotPlannerDayHarness);

  /** Day labels in display order */
  async getDayLabels(): Promise<string[]> {
    const days = await this.days();
    return Promise.all(days.map((day) => day.getLabel()));
  }

  /** Labels of the days the timeslot being dragged can be dropped on */
  async getDropTargetDayLabels(): Promise<string[]> {
    const dropTargets: string[] = [];
    for (const day of await this.days()) {
      if (await day.isDropTarget()) {
        dropTargets.push(await day.getLabel());
      }
    }
    return dropTargets;
  }

  /** Time ranges of the timeslots listed under the day, in display order */
  async getTimeRanges(dayLabel: string): Promise<string[]> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.getTimeRanges();
      }
    }
    return [];
  }
}
