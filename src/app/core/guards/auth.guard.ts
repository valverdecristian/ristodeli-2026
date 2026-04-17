import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el signal de currentUser tiene datos, permitimos el paso
  if (authService.currentUser()) {
    return true;
  }

  // Si hay un anónimo en localStorage, también lo dejamos pasar
  if (localStorage.getItem('anonimo_id')) {
    return true;
  }

  // Si no está logueado, lo mandamos al login
  router.navigate(['/login']);
  return false;
};