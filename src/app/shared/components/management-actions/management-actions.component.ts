import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonRippleEffect } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, fastFoodOutline, gridOutline, peopleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-management-actions',
  templateUrl: './management-actions.component.html',
  styleUrls: ['./management-actions.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonRippleEffect]
})
export class ManagementActionsComponent implements OnInit {

  @Output() actionClicked = new EventEmitter<string>();

  actions = [
    { title: 'Agregar Empleado', icon: 'person-add-outline', color: 'var(--risto-russet)', action: 'add_employee' },
    { title: 'Agregar Plato', icon: 'fast-food-outline', color: 'var(--risto-russet)', action: 'add_dish' },
    { title: 'Agregar Mesa', icon: 'grid-outline', color: 'var(--risto-russet)', action: 'add_table' },
    { title: 'Aprobar Clientes', icon: 'people-outline', color: 'var(--risto-russet)', action: 'approve_clients' }
  ];

  constructor() {
    addIcons({ personAddOutline, fastFoodOutline, gridOutline, peopleOutline });
  }

  ngOnInit() {}

  handleAction(action: string) {
    this.actionClicked.emit(action);
  }
}
