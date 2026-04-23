import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-boton-consulta-mozo',
  templateUrl: './boton-consulta-mozo.component.html',
  styleUrls: ['./boton-consulta-mozo.component.scss'],
  imports: [IonButton]
})
export class BotonConsultaMozoComponent {

  @Input() mesaId: string = '1';
  @Output() consultaClick = new EventEmitter<void>();  

  constructor(private router: Router) {}

  consultarAlMozo() {
    this.consultaClick.emit();
    this.router.navigate(['/chat', this.mesaId]);
  }
}