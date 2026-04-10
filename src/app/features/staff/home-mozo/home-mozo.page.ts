import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-home-mozo',
  templateUrl: './home-mozo.page.html',
  styleUrls: ['./home-mozo.page.scss'],
  standalone: true,
  imports: [IonicModule,CommonModule, FormsModule]
})
export class HomeMozoPage implements OnInit {

  constructor(
    private authService: AuthService
  ) { 
    addIcons({ logOutOutline });
  }

  ngOnInit() {
  }

  logout() {
    this.authService.cerrarSesion();
  }
}
