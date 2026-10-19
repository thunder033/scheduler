import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import {
  TimeslotCardHarness,
  TimeslotCardHarnessFilters,
} from '../timeslot-card/timeslot-card.harness';
import { dayElementId } from './timeslot-planner.component';

export const DAY_SELECTOR = qaSelector('day');
const DROP_TARGET_CLASS = 'cdk-drop-list-receiving';
const NO_FLOATING_TIMESLOT_MESSAGE = 'A new timeslot should be floating';

export interface TimeslotPlannerDayHarnessFilters extends BaseHarnessFilters {
  /** The ISO 8601 day of week */
  dayOfWeek?: number;
  label?: string | RegExp;
}

export class TimeslotPlannerDayHarness extends ComponentHarness {
  static hostSelector = DAY_SELECTOR;

  static with(
    options: TimeslotPlannerDayHarnessFilters = {},
  ): HarnessPredicate<TimeslotPlannerDayHarness> {
    return new HarnessPredicate(TimeslotPlannerDayHarness, options)
      .addOption(
        'dayOfWeek',
        options.dayOfWeek,
        async (harness, dayOfWeek) =>
          (await (await harness.host()).getAttribute('id')) ===
          dayElementId(dayOfWeek),
      )
      .addOption('label', options.label, (harness, label) =>
        HarnessPredicate.stringMatches(harness.getLabel(), label),
      );
  }

  private readonly label = this.locatorFor(qaSelector('day-label'));

  async getLabel(): Promise<string> {
    return (await this.label()).text();
  }

  async getTimeslotCard(
    filters: TimeslotCardHarnessFilters = {},
  ): Promise<TimeslotCardHarness> {
    return this.locatorFor(TimeslotCardHarness.with(filters))();
  }

  async getTimeslotCards(
    filters: TimeslotCardHarnessFilters = {},
  ): Promise<TimeslotCardHarness[]> {
    return this.locatorForAll(TimeslotCardHarness.with(filters))();
  }

  /** Time ranges of the timeslots listed under the day, in display order */
  async getTimeRanges(): Promise<string[]> {
    const cards = await this.getTimeslotCards();
    return Promise.all(cards.map((card) => card.getTimeRange()));
  }

  async isDropTarget(): Promise<boolean> {
    return (await this.host()).hasClass(DROP_TARGET_CLASS);
  }
}

export class TimeslotPlannerHarness extends ComponentHarness {
  static hostSelector = 'lib-timeslot-planner';

  private readonly newTimeslotControl = this.locatorFor(
    MatButtonHarness.with({ selector: qaSelector('new-timeslot') }),
  );

  /** The new timeslot, which floats until it is dragged to a day, if there is one */
  floatingTimeslot = this.locatorForOptional(
    TimeslotCardHarness.with({ ancestor: qaSelector('floating-timeslot') }),
  );

  /** The card of the timeslot, which is the new timeslot's when the id is empty */
  async getTimeslotCard(
    filters: TimeslotCardHarnessFilters,
  ): Promise<TimeslotCardHarness> {
    return this.locatorFor(TimeslotCardHarness.with(filters))();
  }

  async getDay(
    filters: TimeslotPlannerDayHarnessFilters,
  ): Promise<TimeslotPlannerDayHarness> {
    return this.locatorFor(TimeslotPlannerDayHarness.with(filters))();
  }

  /** The days in display order */
  async getDays(
    filters: TimeslotPlannerDayHarnessFilters = {},
  ): Promise<TimeslotPlannerDayHarness[]> {
    return this.locatorForAll(TimeslotPlannerDayHarness.with(filters))();
  }

  /** Starts creating a timeslot, which floats until it is dragged to a day */
  async startCreatingTimeslot() {
    await (await this.newTimeslotControl()).click();

    const floatingTimeslot = await this.floatingTimeslot();
    assert(floatingTimeslot, NO_FLOATING_TIMESLOT_MESSAGE);

    return floatingTimeslot;
  }

  /** Whether a new timeslot is floating, because it has not been dragged to a day yet */
  async hasFloatingTimeslot(): Promise<boolean> {
    return (await this.floatingTimeslot()) !== null;
  }

  /** Day labels in display order */
  async getDayLabels(): Promise<string[]> {
    const days = await this.getDays();
    return Promise.all(days.map((day) => day.getLabel()));
  }

  /** Labels of the days the timeslot being dragged can be dropped on */
  async getDropTargetDayLabels(): Promise<string[]> {
    const dropTargets: string[] = [];
    for (const day of await this.getDays()) {
      if (await day.isDropTarget()) {
        dropTargets.push(await day.getLabel());
      }
    }
    return dropTargets;
  }
}
