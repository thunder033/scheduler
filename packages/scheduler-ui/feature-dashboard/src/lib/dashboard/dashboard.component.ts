import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@scheduler/ui/state';

export const WELCOME_MESSAGE = 'Welcome';

@Component({
  selector: 'lib-dashboard',
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  protected readonly welcome = WELCOME_MESSAGE;
  protected readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );
}
