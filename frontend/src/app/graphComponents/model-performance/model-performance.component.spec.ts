import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelPerformanceComponent } from './model-performance.component';

describe('ModelPerformanceComponent', () => {
  let component: ModelPerformanceComponent;
  let fixture: ComponentFixture<ModelPerformanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModelPerformanceComponent]
    });
    fixture = TestBed.createComponent(ModelPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
