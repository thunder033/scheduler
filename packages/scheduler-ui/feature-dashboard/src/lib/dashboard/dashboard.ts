import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserRole } from '@org/models';
import { LocalUserState } from '@org/scheduler-ui/state';
import { Header } from '../header/header';
import { PlanningFeedback } from '../planning-feedback/planning-feedback';
import { TimeslotPlanner } from '../timeslot-planner/timeslot-planner';

@Component({
  selector: 'lib-dashboard',
  imports: [Header, TimeslotPlanner],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  protected readonly isCoordinator = inject(Store).selectSignal(
    LocalUserState.hasRole(UserRole.Coordinator),
  );

  constructor() {
    inject(PlanningFeedback);
  }
}
