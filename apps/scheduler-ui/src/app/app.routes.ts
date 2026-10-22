import { Route } from '@angular/router';
import { DASHBOARD_PATH, LOGIN_PATH } from './app.paths';
import { authGuard } from './auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: DASHBOARD_PATH,
    pathMatch: 'full',
  },
  {
    path: LOGIN_PATH,
    loadChildren: () =>
      import('@scheduler/ui/feature-auth').then((m) => m.featureAuthRoutes),
  },
  {
    path: DASHBOARD_PATH,
    canActivate: [authGuard],
    loadChildren: () =>
      import('@scheduler/ui/feature-dashboard').then(
        (m) => m.featureDashboardRoutes,
      ),
  },
  {
    path: '**',
    redirectTo: DASHBOARD_PATH,
  },
];
