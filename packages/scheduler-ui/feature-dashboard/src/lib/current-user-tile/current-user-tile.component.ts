import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@scheduler/ui/state';

@Component({
  selector: 'lib-current-user-tile',
  templateUrl: './current-user-tile.component.html',
  host: { class: 'me-2' },
})
export class CurrentUserTileComponent {
  protected readonly currentUser = inject(Store).selectSignal(
    LocalUserState.currentUser,
  );
}
