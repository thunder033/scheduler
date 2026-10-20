import { ComponentHarness } from '@angular/cdk/testing';
import { qaSelector } from '@org/scheduler-ui/test-utils';
import {
  OpenTimeslotCardHarness,
  OpenTimeslotCardHarnessFilters,
} from '../open-timeslot-card/open-timeslot-card.harness';

const TODAY_CLASS = 'today';

export interface DayHeading {
  name: string;
  date: string;
  /** Whether the day is highlighted as the current day */
  isToday: boolean;
}

export class AppointmentsDayHarness extends ComponentHarness {
  static hostSelector = qaSelector('day');

  private readonly name = this.locatorFor(qaSelector('day-name'));
  private readonly date = this.locatorFor(qaSelector('day-date'));

  async getHeading(): Promise<DayHeading> {
    return {
      name: await (await this.name()).text(),
      date: await (await this.date()).text(),
      isToday: await (await this.host()).hasClass(TODAY_CLASS),
    };
  }

  /** The open timeslots listed under the day, in display order */
  async getOpenTimeslotCards(
    filters: OpenTimeslotCardHarnessFilters = {},
  ): Promise<OpenTimeslotCardHarness[]> {
    return this.locatorForAll(OpenTimeslotCardHarness.with(filters))();
  }

  /** Time ranges of the open timeslots listed under the day, in display order */
  async getTimeRanges(): Promise<string[]> {
    const cards = await this.getOpenTimeslotCards();
    return Promise.all(cards.map((card) => card.getTimeRange()));
  }
}

export class AppointmentsHarness extends ComponentHarness {
  static hostSelector = 'lib-appointments';

  private readonly weekTitle = this.locatorFor(qaSelector('week-title'));
  private readonly previousWeekControl = this.locatorFor(
    qaSelector('previous-week'),
  );
  private readonly nextWeekControl = this.locatorFor(qaSelector('next-week'));

  async getWeekTitle(): Promise<string> {
    return (await this.weekTitle()).text();
  }

  /** The days of the week, in display order */
  async getDays(): Promise<AppointmentsDayHarness[]> {
    return this.locatorForAll(AppointmentsDayHarness)();
  }

  /** The headings of the days, in display order */
  async getDayHeadings(): Promise<DayHeading[]> {
    const days = await this.getDays();
    return Promise.all(days.map((day) => day.getHeading()));
  }

  /** Time ranges of the open timeslots listed under each day, in display order of the days */
  async getTimeRangesByDay(): Promise<string[][]> {
    const days = await this.getDays();
    return Promise.all(days.map((day) => day.getTimeRanges()));
  }

  async previousWeek(): Promise<void> {
    return (await this.previousWeekControl()).click();
  }

  async nextWeek(): Promise<void> {
    return (await this.nextWeekControl()).click();
  }
}
