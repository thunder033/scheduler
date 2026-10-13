import { EnvironmentProviders, isDevMode } from '@angular/core';
import { provideStore } from '@ngxs/store';
import { withNgxsReduxDevtoolsPlugin } from '@ngxs/devtools-plugin';
import { withNgxsLoggerPlugin } from '@ngxs/logger-plugin';
import { withNgxsRouterPlugin } from '@ngxs/router-plugin';
import { withNgxsStoragePlugin } from '@ngxs/storage-plugin';
import { LOCAL_USER_STATE_NAME } from './local-user/local-user.model';
import { LocalUserState } from './local-user/local-user.state';
import { UsersState } from './users/users.state';

export const STORAGE_NAMESPACE = 'scheduler-ui';

export const PERSISTED_STATE_KEYS = [
  `${LOCAL_USER_STATE_NAME}.themePreference`,
];

export function provideSchedulerUiState(): EnvironmentProviders {
  const devPlugins = isDevMode()
    ? [withNgxsReduxDevtoolsPlugin(), withNgxsLoggerPlugin()]
    : [];

  return provideStore(
    [LocalUserState, UsersState],
    withNgxsRouterPlugin(),
    withNgxsStoragePlugin({
      keys: PERSISTED_STATE_KEYS,
      namespace: STORAGE_NAMESPACE,
    }),
    ...devPlugins,
  );
}
