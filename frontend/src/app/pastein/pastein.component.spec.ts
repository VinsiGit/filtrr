import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasteinComponent } from './pastein.component';

describe('PasteinComponent', () => {
  let component: PasteinComponent;
  let fixture: ComponentFixture<PasteinComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasteinComponent]
    });
    fixture = TestBed.createComponent(PasteinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
