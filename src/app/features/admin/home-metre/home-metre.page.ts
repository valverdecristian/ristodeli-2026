import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { addIcons } from 'ionicons';
import { logOutOutline, restaurantOutline, personAddOutline, listOutline, gridOutline } from 'ionicons/icons';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-home-metre',
  templateUrl: './home-metre.page.html',
  styleUrls: ['./home-metre.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class HomeMetrePage implements OnInit {

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router
  ) { 
    addIcons({ logOutOutline, restaurantOutline, personAddOutline, listOutline, gridOutline });
  }

  ngOnInit() {
  }

  verListaEspera() {
    this.toastService.mostrarAdvertencia('La función de Lista de Espera estará disponible próximamente.');
  }

  verListaMesas() {
    this.toastService.mostrarAdvertencia('La función de Lista de Mesas estará disponible próximamente.');
  }

  logout() {
    this.authService.cerrarSesion();
  }

}
