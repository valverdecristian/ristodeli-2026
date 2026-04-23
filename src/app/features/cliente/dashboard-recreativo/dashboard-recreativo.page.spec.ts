import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardRecreativoPage } from './dashboard-recreativo.page';

describe('DashboardRecreativoPage', () => {
  let component: DashboardRecreativoPage;
  let fixture: ComponentFixture<DashboardRecreativoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardRecreativoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
