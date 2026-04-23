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

  // Administración y Supervisión
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard] 
  },
  {
    path: 'supervisor',
    loadComponent: () => import('./features/admin/supervisor/supervisor.page').then(m => m.SupervisorPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['supervisor', 'admin'] } 
  },
  {
    path: 'admin/crear-empleado',
    loadComponent: () => import('./features/admin/crear-empleado/crear-empleado.page').then(m => m.CrearEmpleadoPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] }
  },
  {
    path: 'aprobacion-clientes',
    loadComponent: () => import('./features/admin/aprobacion-clientes/aprobacion-clientes.page').then(m => m.AprobacionClientesPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] } 
  },

  // Gestión de Mesas y Lista de Espera
  {
    path: 'gestion-mesas',
    loadComponent: () => import('./features/admin/gestion-mesas/gestion-mesas.page').then(m => m.GestionMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor'] }
  },
  {
    path: 'listado-mesas',
    loadComponent: () => import('./features/admin/listado-mesas/listado-mesas.page').then(m => m.ListadoMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor', 'metre'] } 
  },
  {
    path: 'estado-mesas',
    loadComponent: () => import('./features/admin/estado-mesas/estado-mesas.page').then( m => m.EstadoMesasPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor', 'metre'] }
  },
  {
    path: 'lista-espera',
    loadComponent: () => import('./features/admin/lista-espera/lista-espera.page').then( m => m.ListaEsperaPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin', 'supervisor', 'metre'] }
  },

  // Staff Operativo
  {
    path: 'home-metre',
    loadComponent: () => import('./features/admin/home-metre/home-metre.page').then( m => m.HomeMetrePage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['metre'] }
  },
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
    data: { roles: ['bartender', 'cantinero'] }
  },
  {
    path: 'home-mozo',
    loadComponent: () => import('./features/staff/home-mozo/home-mozo.page').then(m => m.HomeMozoPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['mozo'] }
  },

  // Productos y Pedidos
  {
    path: 'alta-producto/:tipo',
    loadComponent: () => import('./shared/components/formulario-producto/formulario-producto.page').then(m => m.FormularioProductoComponent),
    canActivate: [authGuard, roleGuard], 
    data: { roles: ['cocinero', 'bartender', 'cantinero', 'admin', 'supervisor'] }
  },
  {
    path: 'visualizar-productos/:tipo',
    loadComponent: () => import('./shared/components/visualizar-productos/visualizar-productos.component').then(m => m.VisualizarProductosComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cocinero', 'bartender', 'cantinero', 'admin', 'supervisor'] }
  },
  {
    path: 'pedidos-pendientes/:sector',
    loadComponent: () => import('./features/cocina-bar/pedidos-pendientes/pedidos-pendientes.page').then(m => m.PedidosPendientesPage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cocinero', 'bartender', 'cantinero', 'admin'] }
  },

  // Clientes y Flujo Gamma
  {
    path: 'home-cliente',
    loadComponent: () => import('./features/cliente/home-cliente/home-cliente.page').then(m => m.HomeClientePage),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['cliente_reg', 'anonimo'] }
  },
  {
    path: 'espera-anonimo',
    loadComponent: () => import('./features/cliente/espera-anonimo/espera-anonimo.page').then( m => m.EsperaAnonimoPage)
  },
  {
    path: 'graficos-encuestas',
    loadComponent: () => import('./features/cliente/graficos-encuestas/graficos-encuestas.page').then( m => m.GraficosEncuestasPage)
  },
  {
    path: 'menu-encuestas',
    loadComponent: () => import('./features/cliente/menu-encuestas/menu-encuestas.page').then( m => m.MenuEncuestasPage)
  },
  {
    path: 'dashboard-gestion',
    loadComponent: () => import('./features/cliente/dashboard-gestion/dashboard-gestion.page').then( m => m.DashboardGestionPage)
  },
  {
    path: 'dashboard-recreativo',
    loadComponent: () => import('./features/cliente/dashboard-recreativo/dashboard-recreativo.page').then( m => m.DashboardRecreativoPage)
  }
];