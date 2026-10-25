import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'heroes' },
  {
    path: 'heroes',
    loadChildren: () => import('./features/heroes/heroes.routes').then((m) => m.HEROES_ROUTES),
  },
  { path: '**', redirectTo: 'heroes' },
];
