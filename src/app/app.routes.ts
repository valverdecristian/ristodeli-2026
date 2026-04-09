import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.page').then( m => m.DashboardPage)
  },  {
    path: 'alta-plato',
    loadComponent: () => import('./features/cocina-bar/alta-plato/alta-plato.page').then( m => m.AltaPlatoPage)
  },
  {
    path: 'alta-bebida',
    loadComponent: () => import('./features/cocina-bar/alta-bebida/alta-bebida.page').then( m => m.AltaBebidaPage)
  }

];
