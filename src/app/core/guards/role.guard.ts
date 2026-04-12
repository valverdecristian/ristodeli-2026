import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser(); 

    if (!user) {
        router.navigate(['/login']);
        return false;
    }

    const expectedRoles = route.data['roles'] || [route.data['role']];

    if (expectedRoles && expectedRoles.includes(user.perfil)) {
        return true;
    }

    router.navigate(['/login']); 
    return false;
};