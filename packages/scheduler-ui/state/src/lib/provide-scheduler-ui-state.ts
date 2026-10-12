import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideStore } from '@ngxs/store';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsRouterPlugin } from '@ngxs/router-plugin';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { ThemeState } from './theme/theme.state';

export const STORAGE_NAMESPACE = 'scheduler-ui';

export function provideSchedulerUiState(): EnvironmentProviders {
  const devPlugins = isDevMode()
    ? [withNgxsReduxDevtoolsPlugin(), withNgxsLoggerPlugin()]
    : [];

  return provideStore(
    [ThemeState],
    withNgxsRouterPlugin(),
    withNgxsStoragePlugin({
      keys: [ThemeState],
      namespace: STORAGE_NAMESPACE,
    }),
    ...devPlugins,
  );
}
