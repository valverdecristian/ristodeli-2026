import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser(); 
    const anonimoId = localStorage.getItem('anonimo_id');

    console.log('[RoleGuard] Checking access to:', state.url);
    console.log('[RoleGuard] User signal:', user);
    console.log('[RoleGuard] anonimoId:', anonimoId);

    if (!user && !anonimoId) {
        console.log('[RoleGuard] Denied: No user or anonimoId');
        router.navigate(['/login']);
        return false;
    }

    const expectedRoles = route.data['roles'] || [route.data['role']];
    console.log('[RoleGuard] Expected Roles:', expectedRoles);

    if (anonimoId && !user) {
        if (expectedRoles && expectedRoles.includes('anonimo')) {
            console.log('[RoleGuard] Allowed: Is Anonimo');
            return true;
        }
        console.log('[RoleGuard] Denied: Anonimo not in expected roles');
        router.navigate(['/login']);
        return false;
    }

    if (expectedRoles && expectedRoles.includes(user?.perfil)) {
        console.log('[RoleGuard] Allowed: User role matches', user?.perfil);
        return true;
    }

    console.log('[RoleGuard] Denied: User role', user?.perfil, 'not in expected roles');
    router.navigate(['/login']); 
    return false;
};