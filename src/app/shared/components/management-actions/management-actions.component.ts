import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personAddOutline, fastFoodOutline, gridOutline, peopleOutline, wineOutline, 
  restaurantOutline, iceCreamOutline, clipboardOutline, bookOutline, 
  flaskOutline, swapHorizontalOutline, listOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-management-actions',
  templateUrl: './management-actions.component.html',
  styleUrls: ['./management-actions.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonRippleEffect]
})
export class ManagementActionsComponent implements OnInit {

  @Input() role: string = ''; 
  @Output() actionClicked = new EventEmitter<string>();

  private allActions = [
    // Acciones de Administración (Admin y Supervisor) 
    { title: 'Agregar Empleado', icon: 'person-add-outline', color: '#f5a623', action: 'add_employee', roles: ['admin', 'supervisor'] },
    { title: 'Agregar Mesa', icon: 'grid-outline', color: '#f5a623', action: 'add_table', roles: ['admin', 'supervisor'] },
    { title: 'Gestión De Clientes', icon: 'people-outline', color: '#f5a623', action: 'approve_clients', roles: ['admin', 'supervisor'] },
    
    // Acciones de Cocina 
    { title: 'Agregar Plato', icon: 'fast-food-outline', color: '#3880ff', action: 'add_plato', roles: ['cocinero'] },
    { title: 'Agregar Postre', icon: 'ice-cream-outline', color: '#3880ff', action: 'add_postre', roles: ['cocinero'] },
    { title: 'Menú de Platos y Postres', icon: 'restaurant-outline', color: '#3880ff', action: 'view_menu_platos', roles: ['cocinero'] },
    { title: 'Pedidos Pendientes', icon: 'clipboard-outline', color: '#2dd36f', action: 'view_orders', roles: ['cocinero'] },
    
    // Acciones de Bar 
    { title: 'Agregar Bebida', icon: 'wine-outline', color: '#eb445a', action: 'add_bebida', roles: ['bartender', 'cantinero'] },
    { title: 'Menú Bebidas', icon: 'book-outline', color: '#eb445a', action: 'view_menu_bebidas', roles: ['bartender', 'cantinero'] },
    { title: 'Comandas Bar', icon: 'clipboard-outline', color: '#eb445a', action: 'view_orders_bar', roles: ['bartender', 'cantinero'] },
    
    // Acciones de Metre 
    { title: 'Lista de Espera', icon: 'list-outline', color: '#f5a623', action: 'view_waiting_list', roles: ['metre'] },
    { title: 'Ver Mesas', icon: 'grid-outline', color: '#1e3d1a', action: 'view_tables', roles: ['admin', 'supervisor', 'metre'] },
    { title: 'Estado Mesas', icon: 'swap-horizontal-outline', color: '#f5a623', action: 'manage_status', roles: ['metre'] },
    { title: 'Crear Cliente', icon: 'person-add-outline', color: '#3880ff', action: 'register_client', roles: ['metre'] },
    // Acciones de Mozo
    { title: 'Consultas', icon: 'chatbubble-ellipses-outline', color: '#f5a623', action: 'view_consultas', roles: ['mozo']}
  ];

  visibleActions: any[] = [];

  constructor() {
    addIcons({ 
      personAddOutline, fastFoodOutline, gridOutline, peopleOutline, wineOutline, 
      restaurantOutline, iceCreamOutline, clipboardOutline, bookOutline, 
      flaskOutline, swapHorizontalOutline, listOutline 
    });
  }

  ngOnInit() {
    this.visibleActions = this.allActions.filter(act => act.roles.includes(this.role));
  }

  handleAction(action: string) {
    this.actionClicked.emit(action);
  }
}