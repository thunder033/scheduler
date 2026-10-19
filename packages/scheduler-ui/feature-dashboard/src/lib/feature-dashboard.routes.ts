import { Routes } from '@angular/router';
import { AppointmentsComponent } from './appointments/appointments.component';
import { coordinatorGuard } from './coordinator.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import {
  APPOINTMENTS_PATH,
  TIMESLOTS_PATH,
  WELCOME_PATH,
} from './feature-dashboard.paths';
import { ShellComponent } from './shell/shell.component';
import { TimeslotPlannerComponent } from './timeslot-planner/timeslot-planner.component';

export const featureDashboardRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: WELCOME_PATH, component: DashboardComponent, pathMatch: 'full' },
      {
        path: TIMESLOTS_PATH,
        component: TimeslotPlannerComponent,
        canActivate: [coordinatorGuard],
      },
      { path: APPOINTMENTS_PATH, component: AppointmentsComponent },
    ],
  },
];
