import { Component, computed, input, output } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { AvailabilityStatus } from '@scheduler/models';
import { AvailabilityDotComponent } from '../availability-dot/availability-dot.component';
import { AVAILABILITY_STATUS_LABELS } from '../availability-status/availability-status.component';

export const CONFIRMED_LABEL = 'Confirmed';
export const CONFIRM_PARTICIPANT_LABEL = 'Confirm';

/**
 * A participant with the dot in the color of their availability status. A participant that is confirmed is
 * marked with a check, or while the participant can be confirmed, has a checkbox in front that is checked.
 */
@Component({
  selector: 'sch-participant-availability',
  imports: [AvailabilityDotComponent, MatCheckbox, MatIcon, MatTooltip],
  templateUrl: './participant-availability.component.html',
  host: { class: 'flex items-center gap-2' },
})
export class ParticipantAvailabilityComponent {
  readonly name = input.required<string>();
  readonly status = input.required<AvailabilityStatus>();
  readonly confirmed = input(false);
  /** Whether a checkbox is offered to confirm the participant */
  readonly confirmable = input(false);
  /** Whether the checkbox is shown but cannot be changed, such as for a participant who cannot attend */
  readonly confirmDisabled = input(false);
  /** Whether the participant is to be confirmed, after the checkbox is changed */
  readonly confirmationChange = output<boolean>();

  protected readonly confirmedLabel = CONFIRMED_LABEL;
  protected readonly confirmLabel = CONFIRM_PARTICIPANT_LABEL;
  /** What the color of the dot stands for, which the dot alone does not say */
  protected readonly statusLabel = computed(
    () => AVAILABILITY_STATUS_LABELS[this.status()],
  );
}
