import { Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideSchedulerUiState } from '@org/scheduler-ui/state';

export function provideTestState(): Provider[] {
  localStorage.clear();
  return [provideRouter([]), provideSchedulerUiState()];
}
