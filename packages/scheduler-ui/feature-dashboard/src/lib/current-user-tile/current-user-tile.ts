import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@org/scheduler-ui/state';

@Component({
  selector: 'lib-current-user-tile',
  templateUrl: './current-user-tile.html',
  styleUrl: './current-user-tile.scss',
})
export class CurrentUserTile {
  protected readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );
}
