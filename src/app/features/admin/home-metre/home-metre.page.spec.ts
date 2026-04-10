import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeMetrePage } from './home-metre.page';

describe('HomeMetrePage', () => {
  let component: HomeMetrePage;
  let fixture: ComponentFixture<HomeMetrePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeMetrePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
