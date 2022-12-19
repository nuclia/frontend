import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoButtonComponent } from './sso-button.component';

describe('SsoButtonComponent', () => {
  let component: SsoButtonComponent;
  let fixture: ComponentFixture<SsoButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SsoButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SsoButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
