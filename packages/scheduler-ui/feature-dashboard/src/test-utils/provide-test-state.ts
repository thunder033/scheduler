import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideSchedulerUiState } from '@org/scheduler-ui/state';

export function provideTestState(): (Provider | EnvironmentProviders)[] {
  localStorage.clear();
  return [provideRouter([]), provideSchedulerUiState()];
}
