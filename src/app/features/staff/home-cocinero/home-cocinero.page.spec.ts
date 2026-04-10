import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeCocineroPage } from './home-cocinero.page';

describe('HomeCocineroPage', () => {
  let component: HomeCocineroPage;
  let fixture: ComponentFixture<HomeCocineroPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeCocineroPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
