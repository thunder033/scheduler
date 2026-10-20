import { Component, computed, input } from '@angular/core';
import { AvailabilityStatus } from '@org/models';

/**
 * The color each availability status is shown in, which is defined by the theme in
 * styles/_availability-colors.scss. Elements that show a status use these, so it looks the same everywhere.
 */
export const AVAILABILITY_STATUS_COLOR_CLASSES: Record<
  AvailabilityStatus,
  string
> = {
  [AvailabilityStatus.Available]: 'bg-availability-available',
  [AvailabilityStatus.IfNeeded]: 'bg-availability-if-needed',
  [AvailabilityStatus.Unavailable]: 'bg-availability-unavailable',
};

/** A dot in the color of an availability status, which is always shown next to the status' label */
@Component({
  selector: 'lib-availability-dot',
  template: '',
  host: {
    class: 'inline-block size-3 shrink-0 rounded-full',
    'aria-hidden': 'true',
    '[class]': 'colorClass()',
    '[attr.data-status]': 'status()',
  },
})
export class AvailabilityDotComponent {
  readonly status = input.required<AvailabilityStatus>();

  protected readonly colorClass = computed(
    () => AVAILABILITY_STATUS_COLOR_CLASSES[this.status()],
  );
}
