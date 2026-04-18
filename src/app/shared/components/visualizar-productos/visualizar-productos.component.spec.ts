import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VisualizarProductosComponent } from './visualizar-productos.component';

describe('VisualizarProductosComponent', () => {
  let component: VisualizarProductosComponent;
  let fixture: ComponentFixture<VisualizarProductosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [VisualizarProductosComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizarProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
