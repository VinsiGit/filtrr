import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertaintygraphComponent } from './certaintygraph.component';

describe('CertaintygraphComponent', () => {
  let component: CertaintygraphComponent;
  let fixture: ComponentFixture<CertaintygraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CertaintygraphComponent]
    });
    fixture = TestBed.createComponent(CertaintygraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
