import { Component } from '@angular/core';

export const APPOINTMENTS_TITLE = 'Appointments';

@Component({
  selector: 'lib-appointments',
  templateUrl: './appointments.component.html',
})
export class AppointmentsComponent {
  protected readonly title = APPOINTMENTS_TITLE;
}
