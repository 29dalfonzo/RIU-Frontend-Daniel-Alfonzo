import { Routes } from '@angular/router';

import { unsavedChangesGuard } from './pages/hero-form-page/unsaved-changes.guard';

export const HEROES_ROUTES: Routes = [
  {
    path: '',
    title: 'Super heroes',
    loadComponent: () =>
      import('./pages/hero-list-page/hero-list-page.component').then(
        (m) => m.HeroListPageComponent,
      ),
  },
  {
    path: 'new',
    title: 'New hero',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./pages/hero-form-page/hero-form-page.component').then(
        (m) => m.HeroFormPageComponent,
      ),
  },
  {
    path: ':id/edit',
    title: 'Edit hero',
    canDeactivate: [unsavedChangesGuard],
    loadComponent: () =>
      import('./pages/hero-form-page/hero-form-page.component').then(
        (m) => m.HeroFormPageComponent,
      ),
  },
];
