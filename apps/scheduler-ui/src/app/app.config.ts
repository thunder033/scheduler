import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
  MatFormFieldDefaultOptions,
} from '@angular/material/form-field';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideSeedData } from '@scheduler/ui/data/testing';
import { provideSchedulerUiState } from '@scheduler/ui/state';
import { provideCurrentUserInitializer } from './current-user.initializer';

const FORM_FIELD_DEFAULT_OPTIONS: MatFormFieldDefaultOptions = {
  appearance: 'outline',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: FORM_FIELD_DEFAULT_OPTIONS,
    },
    provideRouter(appRoutes),
    provideHttpClient(),
    provideSeedData(),
    provideSchedulerUiState(),
    provideCurrentUserInitializer(),
  ],
};
