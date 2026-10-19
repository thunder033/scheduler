import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from '../side-nav/side-nav.component';

@Component({
  selector: 'lib-shell',
  imports: [SideNavComponent, RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {}
