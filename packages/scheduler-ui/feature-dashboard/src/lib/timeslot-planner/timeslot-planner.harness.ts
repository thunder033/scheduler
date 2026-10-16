import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { qaSelector } from '../../test-utils/qa-selector';
import { dayElementId } from './timeslot-planner.component';
import { TimeslotCardHarness } from '../timeslot-card/timeslot-card.harness';

export const DAY_SELECTOR = qaSelector('day');
const DAY_LABEL_SELECTOR = qaSelector('day-label');
const NEW_TIMESLOT_SELECTOR = qaSelector('new-timeslot');
const FLOATING_TIMESLOT_SELECTOR = qaSelector('floating-timeslot');
const DROP_TARGET_CLASS = 'cdk-drop-list-receiving';

export interface TimeslotTimes {
  start: string;
  end: string;
}

/** Where a new timeslot floats until it is dragged to a day */
class FloatingTimeslotHarness extends ComponentHarness {
  static hostSelector = FLOATING_TIMESLOT_SELECTOR;

  private readonly card = this.locatorFor(TimeslotCardHarness);

  async setTimes({ start, end }: TimeslotTimes): Promise<void> {
    const card = await this.card();
    await card.setStartTime(start);
    await card.setEndTime(end);
  }

  async canSave(): Promise<boolean> {
    return (await this.card()).canSave();
  }

  async toggleEditing(): Promise<void> {
    return (await this.card()).toggleEditing();
  }
}

export interface TimeslotPlannerDayHarnessFilters extends BaseHarnessFilters {
  dayOfWeek: number;
}

export class TimeslotPlannerDayHarness extends ComponentHarness {
  static hostSelector = DAY_SELECTOR;

  /** Finds the day with the ISO 8601 day of week */
  static with(
    options: TimeslotPlannerDayHarnessFilters,
  ): HarnessPredicate<TimeslotPlannerDayHarness> {
    return new HarnessPredicate(TimeslotPlannerDayHarness, options).addOption(
      'dayOfWeek',
      options.dayOfWeek,
      async (harness, dayOfWeek) =>
        (await (await harness.host()).getAttribute('id')) ===
        dayElementId(dayOfWeek),
    );
  }

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

  async isEditing(timeRange: string): Promise<boolean> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        return card.isEditing();
      }
    }
    return false;
  }

  async isEditorAnimating(timeRange: string): Promise<boolean> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        return card.isEditorAnimating();
      }
    }
    return false;
  }

  async toggleEditing(timeRange: string): Promise<void> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        return card.toggleEditing();
      }
    }
  }

  async save(timeRange: string): Promise<void> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        return card.save();
      }
    }
  }

  async canSave(timeRange: string): Promise<boolean> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        return card.canSave();
      }
    }
    return false;
  }

  async setTimes(
    timeRange: string,
    { start, end }: TimeslotTimes,
  ): Promise<void> {
    for (const card of await this.cards()) {
      if ((await card.getTimeRange()) === timeRange) {
        await card.setStartTime(start);
        await card.setEndTime(end);
      }
    }
  }
}

export class TimeslotPlannerHarness extends ComponentHarness {
  static hostSelector = 'lib-timeslot-planner';

  private readonly days = this.locatorForAll(TimeslotPlannerDayHarness);
  private readonly newTimeslotControl = this.locatorFor(
    MatButtonHarness.with({ selector: NEW_TIMESLOT_SELECTOR }),
  );
  private readonly floatingTimeslot = this.locatorForOptional(
    FloatingTimeslotHarness,
  );

  /** The card of the timeslot, which is the new timeslot's when the id is empty */
  async getTimeslotCard(timeslotId: string): Promise<TimeslotCardHarness> {
    return this.locatorFor(TimeslotCardHarness.with({ timeslotId }))();
  }

  /** The day with the ISO 8601 day of week */
  async getDay(dayOfWeek: number): Promise<TimeslotPlannerDayHarness> {
    return this.locatorFor(TimeslotPlannerDayHarness.with({ dayOfWeek }))();
  }

  /** Starts creating a timeslot, which floats until it is dragged to a day */
  async startCreatingTimeslot(): Promise<void> {
    const control = await this.newTimeslotControl();
    await control.click();
  }

  /** Whether a new timeslot is floating, because it has not been dragged to a day yet */
  async hasFloatingTimeslot(): Promise<boolean> {
    return (await this.floatingTimeslot()) !== null;
  }

  async setFloatingTimeslotTimes(times: TimeslotTimes): Promise<void> {
    await (await this.floatingTimeslot())?.setTimes(times);
  }

  async canSaveFloatingTimeslot(): Promise<boolean> {
    return (await (await this.floatingTimeslot())?.canSave()) ?? false;
  }

  /** Stops creating the timeslot that is floating */
  async cancelFloatingTimeslot(): Promise<void> {
    await (await this.floatingTimeslot())?.toggleEditing();
  }

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

  /** Whether the timeslot with the time range listed under the day is being edited */
  async isTimeslotEditing(
    dayLabel: string,
    timeRange: string,
  ): Promise<boolean> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.isEditing(timeRange);
      }
    }
    return false;
  }

  /** Whether the editor of the timeslot with the time range listed under the day is animating */
  async isTimeslotEditorAnimating(
    dayLabel: string,
    timeRange: string,
  ): Promise<boolean> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.isEditorAnimating(timeRange);
      }
    }
    return false;
  }

  /** Starts or stops editing the timeslot with the time range listed under the day */
  async toggleTimeslotEditing(
    dayLabel: string,
    timeRange: string,
  ): Promise<void> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.toggleEditing(timeRange);
      }
    }
  }

  /** Saves the edits to the timeslot with the time range listed under the day */
  async saveTimeslot(dayLabel: string, timeRange: string): Promise<void> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.save(timeRange);
      }
    }
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

  /** Whether the timeslot with the time range listed under the day can be saved */
  async canSaveTimeslot(dayLabel: string, timeRange: string): Promise<boolean> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.canSave(timeRange);
      }
    }
    return false;
  }

  /** Sets the times of the timeslot with the time range listed under the day */
  async setTimeslotTimes(
    dayLabel: string,
    timeRange: string,
    times: TimeslotTimes,
  ): Promise<void> {
    for (const day of await this.days()) {
      if ((await day.getLabel()) === dayLabel) {
        return day.setTimes(timeRange, times);
      }
    }
  }
}
