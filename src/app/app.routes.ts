import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'registro-cliente',
    loadComponent: () => import('./features/auth/registro-cliente/registro-cliente.page').then(m => m.RegistroClientePage)
  },

  /* --- RUTAS PROTEGIDAS --- */

  // Admin y Supervisor comparten el dashboard de gestion

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard] 
  },
  {
    path: 'admin/crear-empleado',
    loadComponent: () => import('./features/admin/crear-empleado/crear-empleado.page').then(m => m.CrearEmpleadoPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] } // Solo el admin crea empleados
  },
  {
    path: 'gestion-mesas',
    loadComponent: () => import('./features/admin/gestion-mesas/gestion-mesas.page').then(m => m.GestionMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] }
  },

  // Staff Operativo

  {
    path: 'home-cocinero',
    loadComponent: () => import('./features/staff/home-cocinero/home-cocinero.page').then(m => m.HomeCocineroPage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'cocinero' }
  },
  {
    path: 'home-cantinero',
    loadComponent: () => import('./features/staff/home-cantinero/home-cantinero.page').then(m => m.HomeCantineroPage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'cantinero' }
  },
  {
    path: 'home-metre',
    loadComponent: () => import('./features/admin/home-metre/home-metre.page').then(m => m.HomeMetrePage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'metre' }
  },
  {
    path: 'home-mozo',
    loadComponent: () => import('./features/staff/home-mozo/home-mozo.page').then(m => m.HomeMozoPage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'mozo' }
  },

  // Clientes
  {
    path: 'home-cliente',
    loadComponent: () => import('./features/cliente/home-cliente/home-cliente.page').then(m => m.HomeClientePage),
    canActivate: [authGuard, roleGuard],
    data: { role: 'cliente_reg' }
  }
];
