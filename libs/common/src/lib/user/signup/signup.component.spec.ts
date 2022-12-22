import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SignupComponent } from './signup.component';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { ReactiveFormsModule } from '@angular/forms';
import { UserContainerComponent } from '@flaps/common';
import { RouterTestingModule } from '@angular/router/testing';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { BackendConfigurationService, LoginService, SignupResponse } from '@flaps/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  let captcha: ReCaptchaV3Service;
  let loginService: LoginService;

  const signupResponse = new BehaviorSubject<SignupResponse>({ action: 'check-mail' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(PaTranslateModule),
        MockModule(ReactiveFormsModule),
        RouterTestingModule,
      ],
      declarations: [SignupComponent, MockComponent(UserContainerComponent)],
      providers: [
        MockProvider(ReCaptchaV3Service, {
          execute: jest.fn((key, action, callback) => callback('some_token')),
        }),
        MockProvider(LoginService, {
          signup: jest.fn(() => signupResponse.asObservable()),
        }),
        MockProvider(BackendConfigurationService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('submitForm', () => {
    const data = {
      name: 'Bruce Wayne',
      company: 'WayneCorp',
      email: 'bruce@wayne.corp',
      password: 'Batman = <3',
    };

    beforeEach(() => {
      captcha = TestBed.inject(ReCaptchaV3Service);
      loginService = TestBed.inject(LoginService);
    });

    it('should do nothing when form is not valid', () => {
      expect(component.signupForm.valid).toBe(false);
      component.submitForm();
      expect(captcha.execute).not.toHaveBeenCalled();
    });

    it('should execute captcha and submit the form when valid', () => {
      component.signupForm.setValue(data);
      component.submitForm();
      expect(captcha.execute).toHaveBeenCalled();
      expect(loginService.signup).toHaveBeenCalledWith(data, 'some_token');
    });

    it('should navigate to check-mail page on success', () => {
      const router = TestBed.inject(Router);
      jest.spyOn(router, 'navigate');
      component.signupForm.setValue(data);
      component.submitForm();
      expect(router.navigate).toHaveBeenCalledWith(
        ['../check-mail'],
        expect.objectContaining({
          queryParams: { email: data.email },
        }),
      );
    });

    it('should display conflict error when signup action is user-action', waitForAsync(() => {
      signupResponse.next({ action: 'user-exists' });
      component.signupForm.setValue(data);
      component.submitForm();
      expect(component.emailControl.errors).toEqual({ conflict: true });
    }));
  });
});
