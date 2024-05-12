import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfusionmatrixComponent } from './confusionmatrix.component';

describe('ConfusionmatrixComponent', () => {
  let component: ConfusionmatrixComponent;
  let fixture: ComponentFixture<ConfusionmatrixComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ConfusionmatrixComponent]
    });
    fixture = TestBed.createComponent(ConfusionmatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
