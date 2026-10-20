import { Component, computed, input } from '@angular/core';
import { AvailabilityStatus } from '@org/models';
import { AvailabilityDotComponent } from '../availability-dot/availability-dot.component';

export const AVAILABILITY_STATUS_LABELS: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.Available]: 'Available',
  [AvailabilityStatus.IfNeeded]: 'If needed',
};

/** An availability status as its label with the dot in its color, which is how it is shown everywhere */
@Component({
  selector: 'lib-availability-status',
  imports: [AvailabilityDotComponent],
  templateUrl: './availability-status.component.html',
  host: { class: 'inline-flex items-center gap-2' },
})
export class AvailabilityStatusComponent {
  readonly status = input.required<AvailabilityStatus>();

  protected readonly label = computed(
    () => AVAILABILITY_STATUS_LABELS[this.status()],
  );
}
