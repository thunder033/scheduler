import { DOCUMENT } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Store } from '@ngxs/store';
import { LocalUserState } from '@org/scheduler-ui/state';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly colorScheme = inject(Store).selectSignal(
    LocalUserState.themeColorScheme,
  );

  protected title = 'scheduler-ui';

  constructor() {
    effect(() => {
      this.document.documentElement.style.colorScheme = this.colorScheme();
    });
  }
}
