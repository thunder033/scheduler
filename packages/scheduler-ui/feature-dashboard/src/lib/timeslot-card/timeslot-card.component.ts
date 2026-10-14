import {
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, required, validate } from '@angular/forms/signals';
import { MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ShowOnDirtyErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { Store } from '@ngxs/store';
import { Timeslot } from '@org/models';
import { UpdateTimeslot } from '@org/scheduler-ui/state';

const TIME_RANGE_SEPARATOR = ' – ';
const TIME_RANGE_ERROR_KIND = 'timeRange';

export const EDIT_TIMESLOT_LABEL = 'Edit timeslot';
export const REQUIRED_TIME_MESSAGE = 'Required';
export const INVALID_TIME_RANGE_MESSAGE = 'Start must be before end';

export function formatTimeRange({
  start,
  end,
}: Pick<Timeslot, 'start' | 'end'>): string {
  return `${start}${TIME_RANGE_SEPARATOR}${end}`;
}

@Component({
  selector: 'lib-timeslot-card',
  imports: [
    FormField,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
  ],
  templateUrl: './timeslot-card.component.html',
  styleUrl: './timeslot-card.component.scss',
})
export class TimeslotCardComponent {
  private readonly store = inject(Store);

  readonly timeslot = input.required<Timeslot>();

  protected readonly editLabel = EDIT_TIMESLOT_LABEL;
  /** Only flags a time once the user has changed it, so untouched fields stay calm */
  protected readonly errorMatcher = new ShowOnDirtyErrorStateMatcher();
  protected readonly timeRange = computed(() =>
    formatTimeRange(this.timeslot()),
  );
  protected readonly editing = signal(false);

  /** The times being edited, which start over whenever the timeslot changes */
  private readonly times = linkedSignal(() => {
    const { start, end } = this.timeslot();
    return { start, end };
  });
  protected readonly timesForm = form(this.times, (path) => {
    required(path.start, { message: REQUIRED_TIME_MESSAGE });
    required(path.end, { message: REQUIRED_TIME_MESSAGE });
    validate(path.start, ({ value, valueOf }) =>
      value() && valueOf(path.end) && value() >= valueOf(path.end)
        ? { kind: TIME_RANGE_ERROR_KIND, message: INVALID_TIME_RANGE_MESSAGE }
        : undefined,
    );
    validate(path.end, ({ value, valueOf }) =>
      value() && valueOf(path.start) && value() <= valueOf(path.start)
        ? { kind: TIME_RANGE_ERROR_KIND, message: INVALID_TIME_RANGE_MESSAGE }
        : undefined,
    );
  });

  constructor() {
    effect(() => this.saveValidChanges());
  }

  protected toggleEditing(): void {
    if (this.editing()) {
      this.discardChanges();
    }
    this.editing.update((editing) => !editing);
  }

  private saveValidChanges(): void {
    const { start, end } = this.times();
    const saved = this.timeslot();
    const changed = start !== saved.start || end !== saved.end;

    if (changed && this.timesForm().valid()) {
      untracked(() =>
        this.store.dispatch(
          new UpdateTimeslot(saved.timeslotId, { start, end }),
        ),
      );
    }
  }

  private discardChanges(): void {
    const { start, end } = this.timeslot();
    this.timesForm().reset({ start, end });
  }
}
