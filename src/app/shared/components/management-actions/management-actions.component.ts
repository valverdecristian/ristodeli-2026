import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core'; // Agregamos Input
import { CommonModule } from '@angular/common';
import { IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, fastFoodOutline, gridOutline, peopleOutline, wineOutline } from 'ionicons/icons';

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
    { title: 'Agregar Empleado', icon: 'person-add-outline', color: '#f5a623', action: 'add_employee', roles: ['admin', 'supervisor'] },
    { title: 'Agregar Plato', icon: 'fast-food-outline', color: '#f5a623', action: 'add_plato', roles: ['admin', 'supervisor'] },
    { title: 'Agregar Bebida', icon: 'wine-outline', color: '#f5a623', action: 'add_bebida', roles: ['admin', 'supervisor'] },
    { title: 'Agregar Mesa', icon: 'grid-outline', color: '#f5a623', action: 'add_table', roles: ['admin', 'supervisor'] },
    { title: 'Gestión De Clientes', icon: 'people-outline', color: '#f5a623', action: 'approve_clients', roles: ['admin', 'supervisor'] }
  ];

  visibleActions: any[] = [];

  constructor() {
    addIcons({ personAddOutline, fastFoodOutline, gridOutline, peopleOutline, wineOutline });
  }

  ngOnInit() {
    this.visibleActions = this.allActions.filter(act => act.roles.includes(this.role));
  }

  handleAction(action: string) {
    this.actionClicked.emit(action);
  }
}