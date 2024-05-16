import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingCountGraphComponent } from './rating-count-graph.component';

describe('RatingCountGraphComponent', () => {
  let component: RatingCountGraphComponent;
  let fixture: ComponentFixture<RatingCountGraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RatingCountGraphComponent]
    });
    fixture = TestBed.createComponent(RatingCountGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
