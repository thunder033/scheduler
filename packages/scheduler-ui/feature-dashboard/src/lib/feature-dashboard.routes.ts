import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import {
  APPOINTMENTS_PATH,
  TIMESLOTS_PATH,
  WELCOME_PATH,
} from './feature-dashboard.paths';
import { ShellComponent } from './shell/shell.component';

export const featureDashboardRoutes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: WELCOME_PATH, component: DashboardComponent, pathMatch: 'full' },
      {
        path: TIMESLOTS_PATH,
        loadChildren: () =>
          import('@scheduler/ui/feature-timeslots').then(
            (m) => m.featureTimeslotsRoutes,
          ),
      },
      {
        path: APPOINTMENTS_PATH,
        loadChildren: () =>
          import('@scheduler/ui/feature-appointments').then(
            (m) => m.featureAppointmentsRoutes,
          ),
      },
    ],
  },
];
