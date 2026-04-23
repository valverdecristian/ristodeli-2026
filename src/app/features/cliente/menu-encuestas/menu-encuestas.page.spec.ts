import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MenuEncuestasPage } from './menu-encuestas.page';

describe('MenuEncuestasPage', () => {
  let component: MenuEncuestasPage;
  let fixture: ComponentFixture<MenuEncuestasPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuEncuestasPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
