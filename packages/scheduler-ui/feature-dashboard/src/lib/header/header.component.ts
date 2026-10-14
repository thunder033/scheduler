import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { CurrentUserTileComponent } from '../current-user-tile/current-user-tile.component';
import { ThemeMenuComponent } from '../theme-menu/theme-menu.component';

export const HEADER_TITLE = 'Scheduler';

@Component({
  selector: 'lib-header',
  imports: [MatToolbar,CurrentUserTileComponent, ThemeMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly title = HEADER_TITLE;
}
