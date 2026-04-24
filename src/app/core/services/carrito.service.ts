import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ItemCarrito {
  producto: any;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private itemsSubject = new BehaviorSubject<ItemCarrito[]>([]);
  public items$ = this.itemsSubject.asObservable();

  constructor() {}

  getItems(): ItemCarrito[] {
    return this.itemsSubject.value;
  }

  agregarItem(producto: any, cantidad: number) {
    const itemsActuales = this.getItems();
    const indiceExistente = itemsActuales.findIndex(item => item.producto.id === producto.id);

    if (indiceExistente !== -1) {
      // Si ya existe, se suma la cantidad
      itemsActuales[indiceExistente].cantidad += cantidad;
      this.itemsSubject.next([...itemsActuales]);
    } else {
      // Si no existe, se añade al arreglo
      this.itemsSubject.next([...itemsActuales, { producto, cantidad }]);
    }
  }

  vaciarCarrito() {
    this.itemsSubject.next([]);
  }

  obtenerTotal(): number {
    return this.getItems().reduce((total, item) => total + (item.producto.precio * item.cantidad), 0);
  }
}
