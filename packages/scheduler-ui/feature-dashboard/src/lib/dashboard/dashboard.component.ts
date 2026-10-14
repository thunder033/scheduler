import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserRole } from '@org/models';
import { LocalUserState } from '@org/scheduler-ui/state';
import { HeaderComponent } from '../header/header.component';
import { PlanningFeedbackService } from '../planning-feedback/planning-feedback.service';
import { TimeslotPlannerComponent } from '../timeslot-planner/timeslot-planner.component';

@Component({
  selector: 'lib-dashboard',
  imports: [HeaderComponent, TimeslotPlannerComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  protected readonly isCoordinator = inject(Store).selectSignal(
    LocalUserState.hasRole(UserRole.Coordinator),
  );

  constructor() {
    inject(PlanningFeedbackService);
  }
}
