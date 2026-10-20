import { Component, input } from '@angular/core';
import { AvailabilityStatus } from '@org/models';
import { AvailabilityDotComponent } from '../availability-dot/availability-dot.component';

/** A member with the dot in the color of their availability status */
@Component({
  selector: 'lib-member-availability',
  imports: [AvailabilityDotComponent],
  templateUrl: './member-availability.component.html',
  host: { class: 'inline-flex items-center gap-2' },
})
export class MemberAvailabilityComponent {
  readonly name = input.required<string>();
  readonly status = input.required<AvailabilityStatus>();
}
