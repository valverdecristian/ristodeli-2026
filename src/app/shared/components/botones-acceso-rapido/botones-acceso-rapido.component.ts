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
    { name: 'Admin', perfil: 'admin', icon: 'shield-outline', email: 'admin@ristodeli.com' },
    { name: 'Mozo', perfil: 'mozo', icon: 'man', email: 'mozo1@ristodeli.com' },
    { name: 'Metre', perfil: 'metre', icon: 'notifications-outline', email: 'metre@ristodeli.com' },
    { name: 'Supervisor', perfil: 'supervisor', icon: 'clipboard-outline', email: 'supervisor@ristodeli.com' },
    { name: 'Cocinero', perfil: 'cocinero', icon: 'flame-outline', email: 'cocinero@ristodeli.com' },
    { name: 'Cantinero', perfil: 'cantinero', icon: 'wine-outline', email: 'cantinero1@ristodeli.com' } // Corregido el perfil
  ];

  constructor(private supabaseService: AuthService) {
    addIcons({ shieldOutline, shirtOutline, notificationsOutline, clipboardOutline, flameOutline, wineOutline, man });
  }

  ngOnInit() { }

  async selectProfile(profile: any) {
    try {
      // Si el perfil ya tiene un email definido (hardcodeado para las pruebas rápido), usar ese.
      // Si no, lo va a buscar dinámicamente a la base de datos.
      let email = profile.email;
      if (!email) {
        email = await this.supabaseService.obtenerEmailPorPerfil(profile.perfil);
      }

      if (email) {
        this.credentialsSelected.emit({ email, password: '12345678' });
      } else {
        console.warn(`No se encontró un correo para el perfil: ${profile.perfil}`);
      }
    } catch (e) {
      console.error('Error obteniendo el correo desde Supabase:', e);
    }
  }

}
