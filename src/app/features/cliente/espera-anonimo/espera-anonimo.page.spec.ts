import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EsperaAnonimoPage } from './espera-anonimo.page';

describe('EsperaAnonimoPage', () => {
  let component: EsperaAnonimoPage;
  let fixture: ComponentFixture<EsperaAnonimoPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(EsperaAnonimoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
