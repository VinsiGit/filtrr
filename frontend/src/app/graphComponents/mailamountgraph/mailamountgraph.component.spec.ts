import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MailamountgraphComponent } from './mailamountgraph.component';

describe('MailamountgraphComponent', () => {
  let component: MailamountgraphComponent;
  let fixture: ComponentFixture<MailamountgraphComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MailamountgraphComponent]
    });
    fixture = TestBed.createComponent(MailamountgraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
