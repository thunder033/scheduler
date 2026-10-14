import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import {
  LoadTimeslots,
  PlanningState,
  UpdateTimeslot,
} from '@org/scheduler-ui/state';
import { TimeslotCardComponent } from '../timeslot-card/timeslot-card.component';

export const TIMESLOT_PLANNER_TITLE = 'Timeslot planner';
export const TIMESLOT_PLANNER_DESCRIPTION =
  'Define available timeslots that recur during each week.';

/** Keyed by ISO 8601 `Timeslot.dayOfWeek` */
export const DAY_LABELS: Record<number, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

/** The parts of a drop the planner relies on; the drop list data is the day of week */
export type TimeslotDrop = Pick<
  CdkDragDrop<number, number, Timeslot>,
  'item' | 'container' | 'previousContainer'
>;

interface PlannerDay {
  dayOfWeek: number;
  label: string;
  timeslots: Timeslot[];
}

function groupByDay(timeslots: Timeslot[]): PlannerDay[] {
  return Object.entries(DAY_LABELS)
    .map(([day, label]) => ({ dayOfWeek: Number(day), label }))
    .sort((first, second) => first.dayOfWeek - second.dayOfWeek)
    .map(({ dayOfWeek, label }) => ({
      dayOfWeek,
      label,
      timeslots: timeslots
        .filter((timeslot) => timeslot.dayOfWeek === dayOfWeek)
        .sort((first, second) => first.start.localeCompare(second.start)),
    }));
}

@Component({
  selector: 'lib-timeslot-planner',
  imports: [
    CdkDrag,
    CdkDropList,
    CdkDropListGroup,
    TimeslotCardComponent,
    MatButton,
    MatIcon,
  ],
  templateUrl: './timeslot-planner.component.html',
  styleUrl: './timeslot-planner.component.scss',
})
export class TimeslotPlannerComponent {
  private readonly store = inject(Store);

  protected readonly title = TIMESLOT_PLANNER_TITLE;
  protected readonly description =TIMESLOT_PLANNER_DESCRIPTION;

  private readonly timeslots = this.store.selectSignal(PlanningState.timeslots);
  protected readonly days = computed(() => groupByDay(this.timeslots()));

  constructor() {
    this.store.dispatch(new LoadTimeslots());
  }

  /** Timeslots are ordered by start time, so only moves between days change anything */
  protected drop({ item, container, previousContainer }: TimeslotDrop): void {
    if (container === previousContainer) {
      return;
    }

    this.store.dispatch(
      new UpdateTimeslot(item.data.timeslotId, { dayOfWeek: container.data }),
    );
  }
}
