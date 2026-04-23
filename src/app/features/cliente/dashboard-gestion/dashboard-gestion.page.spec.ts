import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardGestionPage } from './dashboard-gestion.page';

describe('DashboardGestionPage', () => {
  let component: DashboardGestionPage;
  let fixture: ComponentFixture<DashboardGestionPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardGestionPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
