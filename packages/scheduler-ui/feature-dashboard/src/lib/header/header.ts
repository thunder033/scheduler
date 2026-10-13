import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CurrentUserTile } from '../current-user-tile/current-user-tile';
import { ThemeMenu } from '../theme-menu/theme-menu';

export const HEADER_TITLE = 'Scheduler';

@Component({
  selector: 'lib-header',
  imports: [MatToolbarModule, CurrentUserTile, ThemeMenu],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly title = HEADER_TITLE;
}
