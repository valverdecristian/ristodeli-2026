import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionMesasPage } from './gestion-mesas.page';

describe('GestionMesasPage', () => {
  let component: GestionMesasPage;
  let fixture: ComponentFixture<GestionMesasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(GestionMesasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
