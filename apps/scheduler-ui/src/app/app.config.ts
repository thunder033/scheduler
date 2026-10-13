import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideSchedulerUiState } from '@org/scheduler-ui/state';
import { provideCurrentUserInitializer } from './current-user.initializer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    provideSchedulerUiState(),
    provideCurrentUserInitializer(),
  ],
};
