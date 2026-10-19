import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlanningFeedbackService } from '../planning-feedback/planning-feedback.service';
import { SideNavComponent } from '../side-nav/side-nav.component';

@Component({
  selector: 'lib-shell',
  imports: [SideNavComponent, RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  constructor() {
    inject(PlanningFeedbackService);
  }
}
