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

  {
    path: 'registro-anonimo',
    loadComponent: () => import('./shared/components/registro-anonimo/registro-anonimo.component').then(m => m.RegistroAnonimoComponent)
  },

  /* --- RUTAS PROTEGIDAS --- */

  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard] 
  },
  {
    path: 'admin/crear-empleado',
    loadComponent: () => import('./features/admin/crear-empleado/crear-empleado.page').then(m => m.CrearEmpleadoPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] }
  },
  {
    path: 'gestion-mesas',
    loadComponent: () => import('./features/admin/gestion-mesas/gestion-mesas.page').then(m => m.GestionMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] }
  },

  // Staff Operativo (Unificados a plural 'roles' para que el Guard no falle)
  {
    path: 'home-cocinero',
    loadComponent: () => import('./features/staff/home-cocinero/home-cocinero.page').then(m => m.HomeCocineroPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cocinero'] }
  },
  {
    path: 'home-cantinero',
    loadComponent: () => import('./features/staff/home-cantinero/home-cantinero.page').then(m => m.HomeCantineroPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cantinero'] }
  },
  {
    path: 'gestion-salon',
    loadComponent: () => import('./features/admin/gestion-salon/gestion-salon.page').then(m => m.GestionSalonPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['metre'] }
  },
  {
    path: 'home-mozo',
    loadComponent: () => import('./features/staff/home-mozo/home-mozo.page').then(m => m.HomeMozoPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mozo'] }
  },


  // Clientes
  {
    path: 'home-cliente',
    loadComponent: () => import('./features/cliente/home-cliente/home-cliente.page').then(m => m.HomeClientePage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente_reg'] }
  },
  {
    path: 'aprobacion-clientes',
    loadComponent: () => import('./features/admin/aprobacion-clientes/aprobacion-clientes.page').then(m => m.AprobacionClientesPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] } 
  },
  {
    path: 'alta-producto/:tipo',
    loadComponent: () => import('./features/cocina-bar/alta-producto/alta-producto.page').then(m => m.AltaProductoPage),
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['cocinero', 'cantinero', 'admin', 'supervisor'] }
  },
  {
    path: 'supervisor',
    loadComponent: () => import('./features/admin/supervisor/supervisor.page').then(m => m.SupervisorPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor', 'admin'] } 
  },
  {
    path: 'home-metre',
    loadComponent: () => import('./features/admin/home-metre/home-metre.page').then( m => m.HomeMetrePage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['metre'] }
  }
];
