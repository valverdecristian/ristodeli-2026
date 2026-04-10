import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeCantineroPage } from './home-cantinero.page';

describe('HomeCantineroPage', () => {
  let component: HomeCantineroPage;
  let fixture: ComponentFixture<HomeCantineroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeCantineroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
