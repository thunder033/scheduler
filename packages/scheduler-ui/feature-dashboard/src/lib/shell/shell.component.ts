import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideNavComponent } from '../side-nav/side-nav.component';

@Component({
  selector: 'sch-shell',
  imports: [SideNavComponent, RouterOutlet],
  templateUrl: './shell.component.html',
})
export class ShellComponent {}
