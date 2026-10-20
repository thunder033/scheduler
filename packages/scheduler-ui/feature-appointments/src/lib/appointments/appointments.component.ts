import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { AppointmentWeek } from '@org/scheduler-ui/data';
import {
  LoadAppointmentsByWeek,
  LoadTimeslots,
  PlanningState,
} from '@org/scheduler-ui/state';
import {
  addWeeks,
  eachDayOfInterval,
  endOfISOWeek,
  getISODay,
  getISOWeek,
  getISOWeekYear,
  isToday,
  startOfISOWeek,
  subWeeks,
} from 'date-fns';
import { OpenTimeslotCardComponent } from '../open-timeslot-card/open-timeslot-card.component';

export const PREVIOUS_WEEK_LABEL = 'Previous week';
export const NEXT_WEEK_LABEL = 'Next week';
export const DAY_NAME_FORMAT = 'EEEE';
export const DAY_DATE_FORMAT = 'MMM d';

/** The ISO 8601 week number and year of the week the date is in */
export function weekTitle(date: Date): string {
  return `Week ${getISOWeek(date)}, ${getISOWeekYear(date)}`;
}

/** The Monday through Sunday of the ISO 8601 week the date is in */
export function weekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfISOWeek(date),
    end: endOfISOWeek(date),
  });
}

/** The timeslots on the ISO 8601 day of week, in order of their start */
function timeslotsOnDay(timeslots: Timeslot[], dayOfWeek: number): Timeslot[] {
  return timeslots
    .filter((timeslot) => timeslot.dayOfWeek === dayOfWeek)
    .sort((first, second) => first.start.localeCompare(second.start));
}

@Component({
  selector: 'lib-appointments',
  imports: [DatePipe, MatIconButton, MatIcon, OpenTimeslotCardComponent],
  templateUrl: './appointments.component.html',
  host: { class: 'block p-4' },
})
export class AppointmentsComponent {
  private readonly store = inject(Store);

  protected readonly title = 'Appointments';
  protected readonly description =
    'Specify availability for appointments based on timeslots.';

  protected readonly previousLabel = PREVIOUS_WEEK_LABEL;
  protected readonly nextLabel = NEXT_WEEK_LABEL;
  protected readonly dayNameFormat = DAY_NAME_FORMAT;
  protected readonly dayDateFormat = DAY_DATE_FORMAT;

  /** Any date in the week being viewed */
  private readonly viewedDate = signal(new Date());
  protected readonly weekTitle = computed(() => weekTitle(this.viewedDate()));
  /** The week the appointments of the timeslots belong to */
  protected readonly week = computed<AppointmentWeek>(() => ({
    year: getISOWeekYear(this.viewedDate()),
    week: getISOWeek(this.viewedDate()),
  }));
  private readonly timeslots = this.store.selectSignal(PlanningState.timeslots);
  protected readonly days = computed(() =>
    weekDays(this.viewedDate()).map((date) => ({
      date,
      isToday: isToday(date),
      timeslots: timeslotsOnDay(this.timeslots(), getISODay(date)),
    })),
  );

  constructor() {
    this.store.dispatch(new LoadTimeslots());
    // Availability is added to the appointment of the viewed week, so these have to be known
    effect(() => this.store.dispatch(new LoadAppointmentsByWeek(this.week())));
  }

  protected previousWeek(): void {
    this.viewedDate.update((date) => subWeeks(date, 1));
  }

  protected nextWeek(): void {
    this.viewedDate.update((date) => addWeeks(date, 1));
  }
}
