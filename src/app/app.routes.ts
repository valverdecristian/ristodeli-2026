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
    data: { roles: ['bartender', 'cantinero'] } // Cambiado a bartender para consistencia
  },
  {
    path: 'home-metre',
    loadComponent: () => import('./features/admin/home-metre/home-metre.page').then(m => m.HomeMetrePage),
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
    loadComponent: () => import('./shared/components/formulario-producto/formulario-producto.page').then(m => m.FormularioProductoComponent),
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['cocinero',  'bartender', 'cantinero', 'admin', 'supervisor'] }
  },
  {
    path: 'supervisor',
    loadComponent: () => import('./features/admin/supervisor/supervisor.page').then(m => m.SupervisorPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor', 'admin'] } 
  },
  {
    path: 'pedidos-pendientes/:sector',
    loadComponent: () => import('./features/cocina-bar/pedidos-pendientes/pedidos-pendientes.page').then(m => m.PedidosPendientesPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cocinero', 'bartender', 'admin', 'cantinero'] }
  },
  {
    path: 'pedidos-pendientes-cocina',
    redirectTo: 'pedidos-pendientes/cocina',
    pathMatch: 'full'
  },
  {
    path: 'visualizar-productos/:tipo',
    loadComponent: () => import('./shared/components/visualizar-productos/visualizar-productos.component').then(m => m.VisualizarProductosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cocinero', 'bartender', 'cantinero', 'admin', 'supervisor'] }
  },
  {
    path: 'listado-mesas',
    loadComponent: () => import('./features/admin/listado-mesas/listado-mesas.page').then(m => m.ListadoMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor', 'metre'] } 
  },  {
    path: 'estado-mesas',
    loadComponent: () => import('./features/admin/estado-mesas/estado-mesas.page').then( m => m.EstadoMesasPage)
  },


];