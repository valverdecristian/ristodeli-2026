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
  },
  {
    path: 'alta-plato',
    loadComponent: () => import('./features/cocina-bar/alta-plato/alta-plato.page').then( m => m.AltaPlatoPage)
  },
  {
    path: 'alta-bebida',
    loadComponent: () => import('./features/cocina-bar/alta-bebida/alta-bebida.page').then( m => m.AltaBebidaPage)
  },
  {
    path: 'gestion-mesas',
    loadComponent: () => import('./features/admin/gestion-mesas/gestion-mesas.page').then( m => m.GestionMesasPage)

  },  {
    path: 'home-cocinero',
    loadComponent: () => import('./features/staff/home-cocinero/home-cocinero.page').then( m => m.HomeCocineroPage)
  },
  {
    path: 'home-cantinero',
    loadComponent: () => import('./features/staff/home-cantinero/home-cantinero.page').then( m => m.HomeCantineroPage)
  },
  {
    path: 'home-metre',
    loadComponent: () => import('./features/admin/home-metre/home-metre.page').then( m => m.HomeMetrePage)
  },
  {
    path: 'home-mozo',
    loadComponent: () => import('./features/staff/home-mozo/home-mozo.page').then( m => m.HomeMozoPage)
  },
  {
    path: 'home-dueno',
    loadComponent: () => import('./features/admin/home-dueno/home-dueno.page').then( m => m.HomeDuenoPage)
  },
  {
    path: 'home-cliente',
    loadComponent: () => import('./features/cliente/home-cliente/home-cliente.page').then( m => m.HomeClientePage)
  },
  {
    path: 'aprobacion-clientes',
    loadComponent: () => import('./features/admin/aprobacion-clientes/aprobacion-clientes.page').then( m => m.AprobacionClientesPage)
  }

];