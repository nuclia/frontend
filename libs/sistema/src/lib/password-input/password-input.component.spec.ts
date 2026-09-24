import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonComponent, PaButtonModule, PaFormFieldModule } from '@guillotinaweb/pastanaga-angular';
import { MockModule, ngMocks } from 'ng-mocks';
import { PasswordInputComponent } from './password-input.component';

describe('PasswordInputComponent', () => {
  let component: PasswordInputComponent;
  let fixture: ComponentFixture<PasswordInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordInputComponent, MockModule(PaFormFieldModule), MockModule(PaButtonModule)],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display an input of type password and a button with eye-closed by default', () => {
    expect(component.type).toBe('password');

    const button = ngMocks.find(ButtonComponent);
    expect(button?.componentInstance.icon).toEqual('eye-closed');
  });

  it('should toggle the input type when clicking on the button', () => {
    fixture.debugElement.nativeElement.querySelector('pa-button').click();
    fixture.detectChanges();

    expect(component.type).toBe('text');
    const button = ngMocks.find(ButtonComponent);
    expect(button?.componentInstance.icon).toEqual('eye');
  });
});
