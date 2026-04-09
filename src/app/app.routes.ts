import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'splash',
    loadComponent: () => import('./features/splash/splash.page').then(m => m.SplashPage)
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
    path: 'registro-cliente',
    loadComponent: () => import('./features/auth/registro-cliente/registro-cliente.page').then( m => m.RegistroClientePage)
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.page').then( m => m.DashboardPage)
  },
  {
    path: 'admin/crear-empleado',
    loadComponent: () => import('./features/admin/crear-empleado/crear-empleado.page').then( m => m.CrearEmpleadoPage)
  }
];
