import { Routes } from '@angular/router';
import { coordinatorGuard } from './coordinator.guard';
import { TimeslotPlannerComponent } from './timeslot-planner/timeslot-planner.component';

export const featureTimeslotsRoutes: Routes = [
  {
    path: '',
    component: TimeslotPlannerComponent,
    canActivate: [coordinatorGuard],
  },
];
