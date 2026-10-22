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
import { Timeslot } from '@scheduler/models';
import {
  LoadTimeslots,
  NEW_TIMESLOT,
  PlanningState,
  StartEditingTimeslot,
  UpdateEditingTimeslot,
} from '@scheduler/ui/state';
import { PlanningFeedbackService } from '../planning-feedback/planning-feedback.service';
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

/** The id of the element of the day, which is unique among the days */
export function dayElementId(dayOfWeek: number): string {
  return `planner-day-${dayOfWeek}`;
}

interface PlannerDay {
  dayOfWeek: number;
  elementId: string;
  label: string;
  timeslots: Timeslot[];
}

function groupByDay(
  timeslots: Timeslot[],
  getDayOfWeek: (timeslot: Timeslot) => number,
): PlannerDay[] {
  return Object.entries(DAY_LABELS)
    .map(([day, label]) => ({ dayOfWeek: Number(day), label }))
    .sort((first, second) => first.dayOfWeek - second.dayOfWeek)
    .map(({ dayOfWeek, label }) => ({
      dayOfWeek,
      elementId: dayElementId(dayOfWeek),
      label,
      timeslots: timeslots
        .filter((timeslot) => getDayOfWeek(timeslot) === dayOfWeek)
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
  host: { class: 'block p-4' },
})
export class TimeslotPlannerComponent {
  private readonly store = inject(Store);

  protected readonly title = TIMESLOT_PLANNER_TITLE;
  protected readonly description = TIMESLOT_PLANNER_DESCRIPTION;

  /** Only the timeslot being edited can be dragged to another day */
  protected readonly editingTimeslotId = this.store.selectSignal(
    PlanningState.editingTimeslotId,
  );
  private readonly timeslots = this.store.selectSignal(PlanningState.timeslots);
  private readonly editingTimeslot = this.store.selectSignal(
    PlanningState.editingTimeslot,
  );
  private readonly creating = computed(
    () => this.editingTimeslot()?.timeslotId === NEW_TIMESLOT.timeslotId,
  );
  /** A new timeslot floats below the button until it is dragged to a day, which it has none yet */
  protected readonly floatingTimeslot = computed(() =>
    this.creating() && !this.editingTimeslot()?.dayOfWeek ? NEW_TIMESLOT : null,
  );
  /** A timeslot being edited is listed under the day it was moved to, even before that is saved */
  protected readonly days = computed(() => {
    const editing = this.editingTimeslot();
    const timeslots = this.creating()
      ? [...this.timeslots(), NEW_TIMESLOT]
      : this.timeslots();
    return groupByDay(timeslots, (timeslot) =>
      editing?.timeslotId === timeslot.timeslotId
        ? (editing.dayOfWeek ?? timeslot.dayOfWeek)
        : timeslot.dayOfWeek,
    );
  });
  /** Nothing is dropped back to where the new timeslot floats */
  protected readonly neverEnter = (): boolean => false;

  constructor() {
    inject(PlanningFeedbackService);
    this.store.dispatch(new LoadTimeslots());
  }

  protected startCreating(): void {
    this.store.dispatch(new StartEditingTimeslot(NEW_TIMESLOT.timeslotId));
  }

  /** Moving is part of the edits to the timeslot, which are saved with the rest of them */
  protected drop({ item, container, previousContainer }: TimeslotDrop): void {
    if (container === previousContainer) {
      return;
    }

    this.store.dispatch(
      new UpdateEditingTimeslot({ dayOfWeek: container.data }),
    );
  }
}
