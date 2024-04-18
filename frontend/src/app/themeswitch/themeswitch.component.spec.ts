import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeswitchComponent } from './themeswitch.component';

describe('ThemeswitchComponent', () => {
  let component: ThemeswitchComponent;
  let fixture: ComponentFixture<ThemeswitchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ThemeswitchComponent]
    });
    fixture = TestBed.createComponent(ThemeswitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
