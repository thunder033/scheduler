import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import {
  MatOption,
  MatSelect,
  MatSelectTrigger,
} from '@angular/material/select';
import { AvailabilityStatus } from '@org/models';
import { AvailabilityStatusComponent } from '../availability-status/availability-status.component';

export const AVAILABILITY_LABEL = 'My availability';
export const SET_AVAILABILITY_PLACEHOLDER = 'Set availability';
/** The status that is chosen until another one is */
export const DEFAULT_AVAILABILITY_STATUS = AvailabilityStatus.Available;

/**
 * Chooses an availability status from all of them, each shown as its label with its color. It has
 * no choice until one is made when the value is null, which shows the placeholder.
 */
@Component({
  selector: 'lib-availability-select',
  imports: [
    AvailabilityStatusComponent,
    MatFormField,
    MatLabel,
    MatOption,
    MatSelect,
    MatSelectTrigger,
  ],
  templateUrl: './availability-select.component.html',
  styleUrl: './availability-select.component.scss',
  host: { class: 'block', '[class.compact]': 'compact()' },
})
export class AvailabilitySelectComponent
  implements FormValueControl<AvailabilityStatus | null>
{
  readonly value = model.required<AvailabilityStatus | null>();
  readonly disabled = input(false);
  /** Makes the field shorter, to fit where space is tight */
  readonly compact = input(false);
  /** Shown while there is no choice */
  readonly placeholder = input('');

  protected readonly label = AVAILABILITY_LABEL;
  protected readonly statuses = Object.values(AvailabilityStatus);
}
