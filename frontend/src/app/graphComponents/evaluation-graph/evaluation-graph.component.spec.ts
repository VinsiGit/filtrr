import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluationGraphComponent } from './evaluation-graph.component';

describe('EvaluationGraphComponent', () => {
  let component: EvaluationGraphComponent;
  let fixture: ComponentFixture<EvaluationGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EvaluationGraphComponent]
    });
    fixture = TestBed.createComponent(EvaluationGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
