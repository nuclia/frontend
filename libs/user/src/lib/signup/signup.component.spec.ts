import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  BackendConfigurationService,
  FeaturesService,
  LoginService,
  SignupResponse,
  StaticEnvironmentConfiguration,
} from '@flaps/core';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { MockComponent, MockModule, MockProvider } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { BehaviorSubject, of } from 'rxjs';
import { UserContainerComponent } from '../user-container';
import { SignupComponent } from './signup.component';

@Component({
  template: '',
})
class MockCheckMailComponent {}

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;

  let captcha: ReCaptchaV3Service;
  let loginService: LoginService;
  let router: Router;

  const signupResponse = new BehaviorSubject<SignupResponse>({ action: 'check-mail' });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MockModule(PaTextFieldModule),
        MockModule(PaButtonModule),
        MockModule(PaTranslateModule),
        MockModule(ReactiveFormsModule),
        MockModule(SisPasswordInputModule),
        RouterTestingModule.withRoutes([{ path: 'check-mail', component: MockCheckMailComponent }]),
      ],
      declarations: [SignupComponent, MockComponent(UserContainerComponent)],
      providers: [
        MockProvider(ReCaptchaV3Service, {
          execute: jest.fn(() => of('some_token')),
        }),
        MockProvider(LoginService, {
          signup: jest.fn(() => signupResponse.asObservable()),
        }),
        MockProvider(FeaturesService, {
          unstable: { githubSignin: of(true) },
        } as FeaturesService),
        MockProvider(BackendConfigurationService, {
          getRecaptchaKey: () => 'fake',
          staticConf: { client: '' } as StaticEnvironmentConfiguration,
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('submitForm', () => {
    const data = {
      name: 'Bruce Wayne',
      email: 'bruce@wayne.corp',
      password: 'Batman = <3',
    };

    beforeEach(() => {
      captcha = TestBed.inject(ReCaptchaV3Service);
      loginService = TestBed.inject(LoginService);
      router = TestBed.inject(Router);

      router.navigate = jest.fn();
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
