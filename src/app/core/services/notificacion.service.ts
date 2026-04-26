import { inject, Injectable, Injector } from '@angular/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular/standalone';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private platform = inject(Platform);
  private injector = inject(Injector);

  private get supabase() {
    return this.injector.get(AuthService).supabaseClient;
  }

  constructor() {}

  async inicializarPushNotifications(userId?: string) {
    if (this.platform.is('capacitor')) {
      try {
        // Chequeo de seguridad: Si no estamos en un dispositivo real con Google Services, 
        // a veces PushNotifications puede ser undefined o fallar el chequeo de permisos.
        const permStatus = await PushNotifications.checkPermissions().catch(() => null);
        
        if (!permStatus) {
          console.warn('El plugin de Push no responde. ¿Está configurado Firebase?');
          return;
        }

        let currentStatus = permStatus.receive;

        if (currentStatus === 'prompt') {
          const request = await PushNotifications.requestPermissions();
          currentStatus = request.receive;
        }

        if (currentStatus === 'granted') {
          // SOLO registramos si el permiso es GRANTED para evitar el crash
          await PushNotifications.register().catch(err => {
            console.error("Error crítico al registrar push (posible falta de google-services.json):", err);
          });
        }
        
        this.escucharNotificacionesEventos(userId);
      } catch (fatalError) {
        console.error("Error fatal en inicializarPushNotifications evitó el crash:", fatalError);
      }
    }
  }

  private escucharNotificacionesEventos(userId?: string) {
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Push registration success, token: ' + token.value);
      localStorage.setItem('push_token', token.value);
      
      // Si recibimos el token mientras el usuario ya tiene sesión asíncronamente
      if (userId) {
        await this.guardarTokenEnDB(userId, token.value);
      }
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on push registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push received in foreground: ' + JSON.stringify(notification));
      // Se delega a la configuración nativa mostrar el alert en primer plano
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
    });
  }

  async obtenerPushToken(): Promise<string | null> {
    return localStorage.getItem('push_token');
  }

  async guardarTokenEnDB(userId: string, token: string | null) {
    if (!token) return;
    const { error } = await this.supabase
      .from('usuarios')
      .update({ push_token: token })
      .eq('id', userId);
    
    if (error) {
      console.error('Error guardando push_token en BD:', error.message);
    }
  }

  async eliminarTokenEnDB(userId: string) {
    const { error } = await this.supabase
      .from('usuarios')
      .update({ push_token: null })
      .eq('id', userId);
    
    if (error) {
      console.error('Error eliminando push_token en BD:', error.message);
    }
  }
}
