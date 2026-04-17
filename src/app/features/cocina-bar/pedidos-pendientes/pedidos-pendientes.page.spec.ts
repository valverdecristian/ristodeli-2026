import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PedidosPendientesPage } from './pedidos-pendientes.page';

describe('PedidosPendientesPage', () => {
  let component: PedidosPendientesPage;
  let fixture: ComponentFixture<PedidosPendientesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PedidosPendientesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
