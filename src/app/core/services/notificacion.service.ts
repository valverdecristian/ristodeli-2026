import { inject, Injectable } from '@angular/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Platform } from '@ionic/angular/standalone';
import { ToastService } from './toast.service';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  private platform = inject(Platform);
  private toastService = inject(ToastService);
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async inicializarPushNotifications(userId?: string) {
    if (this.platform.is('capacitor')) {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Permisos de notificaciones push denegados.');
      } else {
        await PushNotifications.register();
      }

      this.escucharNotificacionesEventos(userId);
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
