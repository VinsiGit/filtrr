import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetrainComponent } from './retrain.component';

describe('RetrainComponent', () => {
  let component: RetrainComponent;
  let fixture: ComponentFixture<RetrainComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RetrainComponent]
    });
    fixture = TestBed.createComponent(RetrainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
