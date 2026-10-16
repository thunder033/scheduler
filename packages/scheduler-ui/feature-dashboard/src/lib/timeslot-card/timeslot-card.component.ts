import { CdkDragHandle } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  AnimationCallbackEvent,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
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
import {
  PlanningState,
  StartEditingTimeslot,
  StopEditingTimeslot,
  UpdateTimeslot,
} from '@org/scheduler-ui/state';

const TIME_RANGE_SEPARATOR = ' – ';
const TIME_RANGE_ERROR_KIND = 'timeRange';
const NO_ANIMATION_NAME = 'none';

/** Classes that play the matching keyframes in the component styles */
export const EDITOR_EXPAND_CLASS = 'editor-expand';
export const EDITOR_COLLAPSE_CLASS = 'editor-collapse';
const HANDLE_WIPE_IN_CLASS = 'handle-wipe-in';

export const EDIT_TIMESLOT_LABEL = 'Edit timeslot';
export const REQUIRED_TIME_MESSAGE = 'Required';
export const INVALID_TIME_RANGE_MESSAGE = 'Start must be before end';

export function formatTimeRange({
  start,
  end,
}: Pick<Timeslot, 'start' | 'end'>): string {
  return `${start}${TIME_RANGE_SEPARATOR}${end}`;
}

/**
 * Plays the animation the class applies to the element, then reports it complete.
 * Finishes right away when the class results in no animation.
 */
function playAnimation(
  { target, animationComplete }: AnimationCallbackEvent,
  animationClass: string,
  { keepClass = false }: { keepClass?: boolean } = {},
): void {
  target.classList.add(animationClass);

  const { animationName } = getComputedStyle(target);
  if (!animationName || animationName === NO_ANIMATION_NAME) {
    target.classList.remove(animationClass);
    animationComplete();
    return;
  }

  const finishOnAnimationEnd = (event: Event) => {
    // Animations of descendants bubble up too, such as those Material and the CDK put on inputs
    if (event.target !== target) {
      return;
    }

    target.removeEventListener('animationend', finishOnAnimationEnd);
    if (!keepClass) {
      target.classList.remove(animationClass);
    }
    animationComplete();
  };
  target.addEventListener('animationend', finishOnAnimationEnd);
}

@Component({
  selector: 'lib-timeslot-card',
  imports: [
    CdkDragHandle,
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
  host: { '[class.editing]': 'editing()' },
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
  private readonly editingTimeslotId = this.store.selectSignal(
    PlanningState.editingTimeslotId,
  );
  /**
   * Whether the times are being edited, which also lets the card be dragged to another day.
   * This is kept in the state because the card is recreated when it moves to another day.
   */
  protected readonly editing = computed(
    () => this.editingTimeslotId() === this.timeslot().timeslotId,
  );

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

  /** Whether the card has rendered, so how it was created isn't animated in as if it just changed */
  private hasRendered = false;

  constructor() {
    afterNextRender(() => {
      this.hasRendered = true;
    });
    effect(() => this.saveValidChanges());
    // Times that were never saved don't outlive the editing, however it ends
    effect(() => {
      if (!this.editing()) {
        untracked(() => this.discardChanges());
      }
    });
  }

  protected toggleEditing(): void {
    this.store.dispatch(
      this.editing()
        ? new StopEditingTimeslot()
        : new StartEditingTimeslot(this.timeslot().timeslotId),
    );
  }

  protected expandEditor(event: AnimationCallbackEvent): void {
    this.playIfRendered(event, EDITOR_EXPAND_CLASS);
  }

  protected wipeInHandle(event: AnimationCallbackEvent): void {
    this.playIfRendered(event, HANDLE_WIPE_IN_CLASS);
  }

  protected collapseEditor(event: AnimationCallbackEvent): void {
    // Still editing means the card itself is going away, such as when it moves to another day
    if (this.editing()) {
      event.animationComplete();
      return;
    }
    playAnimation(event, EDITOR_COLLAPSE_CLASS, { keepClass: true });
  }

  /** A card created while its timeslot is being edited shows the editing as it is, without animating in */
  private playIfRendered(
    event: AnimationCallbackEvent,
    animationClass: string,
  ): void {
    if (this.hasRendered) {
      playAnimation(event, animationClass);
    } else {
      event.animationComplete();
    }
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
