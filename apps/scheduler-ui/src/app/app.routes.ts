import { Route } from '@angular/router';

const DASHBOARD_PATH = 'dashboard';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: DASHBOARD_PATH,
    pathMatch: 'full',
  },
  {
    path: DASHBOARD_PATH,
    loadChildren: () =>
      import('@org/scheduler-ui/feature-dashboard').then(
        (m) => m.featureDashboardRoutes,
      ),
  },
  {
    path: '**',
    redirectTo: DASHBOARD_PATH,
  },
];
