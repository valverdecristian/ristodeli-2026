import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton } from '@ionic/angular/standalone';
import { inject } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';

@Component({
  selector: 'app-boton-consulta-mozo',
  templateUrl: './boton-consulta-mozo.component.html',
  styleUrls: ['./boton-consulta-mozo.component.scss'],
  imports: [IonButton]
})
export class BotonConsultaMozoComponent {

  @Input() mesaId: string = '';
  @Output() consultaClick = new EventEmitter<void>();  

  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  constructor(private router: Router) {}

  async consultarAlMozo() {
    this.consultaClick.emit();

    const anonimoId = localStorage.getItem('anonimo_id');
    const user = this.authService.currentUser();
    const clienteId = anonimoId || user?.id;

    if (!clienteId) {
      this.toastService.mostrarError('Error de autenticación.');
      return;
    }

    // Buscamos la mesa asignada del cliente
    const { data: solicitud, error } = await this.authService.supabaseClient
      .from('lista_espera')
      .select('mesa_asignada')
      .eq('cliente_id', clienteId)
      .eq('estado', 'asignado')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !solicitud || !solicitud.mesa_asignada) {
      this.toastService.mostrarError('Primero debes tener una mesa asignada para consultar al mozo.');
      return;
    }

    // Extraemos el número de la mesa
    const mesaReal = solicitud.mesa_asignada.startsWith('MESA_') 
      ? solicitud.mesa_asignada.replace('MESA_', '') 
      : solicitud.mesa_asignada;

    this.router.navigate(['/chat', mesaReal]);
  }
}