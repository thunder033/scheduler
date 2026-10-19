import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import {
  MatListItem,
  MatListItemIcon,
  MatListItemTitle,
  MatNavList,
} from '@angular/material/list';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavContent,
} from '@angular/material/sidenav';
import { MatToolbar } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngxs/store';
import { UserRole } from '@org/models';
import { LocalUserState, SetSideNavCollapsed } from '@org/scheduler-ui/state';
import { map } from 'rxjs';
import { CurrentUserTileComponent } from '../current-user-tile/current-user-tile.component';
import {
  APPOINTMENTS_PATH,
  TIMESLOTS_PATH,
  WELCOME_PATH,
} from '../feature-dashboard.paths';
import { ThemeMenuComponent } from '../theme-menu/theme-menu.component';

export const SIDE_NAV_TITLE = 'Scheduler';
export const SIDE_NAV_TOGGLE_LABEL = 'Toggle navigation';
export const SIDE_NAV_COLLAPSE_LABEL = 'Collapse navigation';
export const SIDE_NAV_EXPAND_LABEL = 'Expand navigation';

const COLLAPSE_ICON = 'chevron_left';
const EXPAND_ICON = 'chevron_right';

export interface NavItem {
  label: string;
  /** Relative to the shell's route */
  path: string;
  icon: string;
  /** When set, only users with this role see the item */
  role?: UserRole;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: WELCOME_PATH, icon: 'home' },
  {
    label: 'Timeslots',
    path: TIMESLOTS_PATH,
    icon: 'schedule',
    role: UserRole.Coordinator,
  },
  { label: 'Appointments', path: APPOINTMENTS_PATH, icon: 'event' },
];

/** Mirrors `$desktop-min-width` in styles/_breakpoints.scss */
export const DESKTOP_MEDIA_QUERY = '(min-width: 48rem)';

const SIDENAV_MODE_DESKTOP = 'side';
const SIDENAV_MODE_MOBILE = 'over';

@Component({
  selector: 'lib-side-nav',
  imports: [
    MatSidenavContainer,
    MatSidenav,
    MatSidenavContent,
    MatToolbar,
    MatNavList,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatIconButton,
    MatIcon,
    MatTooltip,
    RouterLink,
    RouterLinkActive,
    CurrentUserTileComponent,
    ThemeMenuComponent,
  ],
  templateUrl: './side-nav.component.html',
  styleUrl: './side-nav.component.scss',
  host: { class: 'block h-screen' },
})
export class SideNavComponent {
  protected readonly title = SIDE_NAV_TITLE;
  protected readonly toggleLabel = SIDE_NAV_TOGGLE_LABEL;

  private readonly store = inject(Store);
  private readonly currentUser = this.store.selectSignal(
    LocalUserState.currentUser,
  );
  protected readonly navItems = computed(() => {
    const roles = this.currentUser()?.roles ?? [];
    return NAV_ITEMS.filter((item) => !item.role || roles.includes(item.role));
  });

  protected readonly isDesktop = toSignal(
    inject(BreakpointObserver)
      .observe(DESKTOP_MEDIA_QUERY)
      .pipe(map(({ matches }) => matches)),
    { initialValue: false },
  );
  protected readonly mode = linkedSignal(() =>
    this.isDesktop() ? SIDENAV_MODE_DESKTOP : SIDENAV_MODE_MOBILE,
  );
  /** Open by default on desktop, closed behind the hamburger menu on narrow screens */
  protected readonly isOpen = linkedSignal(() => this.isDesktop());

  /** Whether the user folded the sidebar down to its icons; only applies on desktop */
  private readonly collapsedByUser = this.store.selectSignal(
    LocalUserState.sideNavCollapsed,
  );
  protected readonly isCollapsed = computed(
    () => this.isDesktop() && this.collapsedByUser(),
  );
  protected readonly collapseLabel = computed(() =>
    this.isCollapsed() ? SIDE_NAV_EXPAND_LABEL : SIDE_NAV_COLLAPSE_LABEL,
  );
  protected readonly collapseIcon = computed(() =>
    this.isCollapsed() ? EXPAND_ICON : COLLAPSE_ICON,
  );

  protected toggleCollapsed(): void {
    this.store.dispatch(new SetSideNavCollapsed(!this.collapsedByUser()));
  }

  protected toggle(): void {
    this.isOpen.update((open) => !open);
  }
}
