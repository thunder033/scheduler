import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@org/scheduler-ui/state';

@Component({
  selector: 'lib-current-user-tile',
  templateUrl: './current-user-tile.component.html',
  styleUrl: './current-user-tile.component.scss',
})
export class CurrentUserTileComponent {
  protected readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );
}
