import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { shieldOutline, shirtOutline, notificationsOutline, flameOutline, wineOutline, clipboardOutline, man } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-botones-acceso-rapido',
  templateUrl: './botones-acceso-rapido.component.html',
  styleUrls: ['./botones-acceso-rapido.component.scss'],
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon]
})
export class BotonesAccesoRapidoComponent implements OnInit {

  @Output() credentialsSelected = new EventEmitter<{ email: string, password: string }>();

  profiles = [ //ver en el futuro posibles cambios de iconos por unos mejores (diseñados por ALEJO (IA))
    { name: 'Admin', perfil: 'admin', icon: 'shield-outline' },
    { name: 'Mozo', perfil: 'mozo', icon: 'man' },
    { name: 'Metre', perfil: 'metre', icon: 'notifications-outline' },
    { name: 'Supervisor', perfil: 'supervisor', icon: 'clipboard-outline' },
    { name: 'Cocinero', perfil: 'cocinero', icon: 'flame-outline' },
    { name: 'Cantinero', perfil: 'cantinero', icon: 'wine-outline' }
  ];

  constructor(private supabaseService: AuthService) {
    addIcons({ shieldOutline, shirtOutline, notificationsOutline, clipboardOutline, flameOutline, wineOutline, man });
  }

  ngOnInit() { }

  async selectProfile(perfil: string) {
    try {
      // Usar el método correcto para buscar por perfil y no por sesión actual
      const email = await this.supabaseService.obtenerEmailPorPerfil(perfil);

      if (email) {
        this.credentialsSelected.emit({ email, password: '12345678' });
      } else {
        console.warn(`No se encontró un correo para el perfil: ${perfil}`);
      }
    } catch (e) {
      console.error('Error obteniendo el correo desde Supabase:', e);
    }
  }

}
