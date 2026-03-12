import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { BackendConfigurationService, LoginService } from '@flaps/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { SisModalService, SisPasswordInputModule } from '@nuclia/sistema';
import { MockComponent, MockModule } from 'ng-mocks';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { UserContainerComponent } from '../user-container';
import { RecoverComponent } from './recover.component';

describe('RecoverComponent', () => {
  let component: RecoverComponent;
  let fixture: ComponentFixture<RecoverComponent>;
  let queryParams$: BehaviorSubject<{ login_challenge?: string; isPasswordInit?: boolean }>;

  let loginService: { recover: jest.Mock };
  let reCaptchaV3Service: { execute: jest.Mock };
  let config: { getRecaptchaKey: jest.Mock; getAppName: jest.Mock };
  let modalService: { openConfirm: jest.Mock };
  let translateService: { get: jest.Mock };
  beforeEach(waitForAsync(() => {
    queryParams$ = new BehaviorSubject<{ login_challenge?: string; isPasswordInit?: boolean }>({
      login_challenge: 'challenge-1',
      isPasswordInit: true,
    });

    loginService = {
      recover: jest.fn(() => of({ action: 'check-mail' })),
    };

    reCaptchaV3Service = {
      execute: jest.fn(() => of('captcha-token')),
    };

    config = {
      getRecaptchaKey: jest.fn(() => 'key'),
      getAppName: jest.fn(() => 'platform'),
    };

    modalService = {
      openConfirm: jest.fn(() => ({ onClose: of(undefined) })),
    };

    translateService = {
      get: jest.fn(() => of('translated-message')),
    };

    TestBed.configureTestingModule({
      declarations: [RecoverComponent],
      imports: [
        MockModule(ReactiveFormsModule),
        MockModule(PaButtonModule),
        MockModule(PaTextFieldModule),
        MockModule(PaTranslateModule),
        MockModule(SisPasswordInputModule),
        MockComponent(UserContainerComponent),
        RouterModule.forRoot([]),
      ],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } },
        { provide: LoginService, useValue: loginService },
        { provide: ReCaptchaV3Service, useValue: reCaptchaV3Service },
        { provide: BackendConfigurationService, useValue: config },
        { provide: SisModalService, useValue: modalService },
        { provide: TranslateService, useValue: translateService },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read login challenge and password init from query params', () => {
    expect(component.loginChallenge).toBe('challenge-1');
    expect(component.isPasswordInit).toBe(true);
  });

  it('should not execute captcha when submit is called with invalid form', () => {
    component.recoverForm.controls.email.setValue('');

    component.submit();

    expect(reCaptchaV3Service.execute).not.toHaveBeenCalled();
    expect(loginService.recover).not.toHaveBeenCalled();
  });

  it('should execute captcha and call recover with token when submit is valid', () => {
    const recoverSpy = jest.spyOn(component, 'recover');
    component.recoverForm.controls.email.setValue('user@example.com');

    component.submit();

    expect(reCaptchaV3Service.execute).toHaveBeenCalledWith('recover');
    expect(recoverSpy).toHaveBeenCalledWith('captcha-token');
  });

  it('should call loginService.recover with expected payload', () => {
    component.recoverForm.controls.email.setValue('user@example.com');

    component.recover('captcha-token');

    expect(config.getAppName).toHaveBeenCalled();
    expect(loginService.recover).toHaveBeenCalledWith(
      {
        username: 'user@example.com',
        app: 'platform',
        login_challenge: 'challenge-1',
        initial_setpassword: true,
      },
      'captcha-token',
    );
  });

  it('should open confirmation modal with translated message and redirect on close', () => {
    component.recoverForm.controls.email.setValue('user@example.com');

    component.recover('captcha-token');

    expect(translateService.get).toHaveBeenCalledWith('login.check_email.email_sent');
    expect(translateService.get).toHaveBeenCalledWith('recover.verify');
    expect(modalService.openConfirm).toHaveBeenCalledWith({
      title: 'login.check_email.title',
      description: 'translated-message<br>translated-message',
      confirmLabel: 'Ok',
      onlyConfirm: true,
    });
  });

  it('should not call recover when recaptcha execution fails', () => {
    reCaptchaV3Service.execute.mockReturnValueOnce(throwError(() => new Error('recaptcha failed')));
    component.recoverForm.controls.email.setValue('user@example.com');
    const recoverSpy = jest.spyOn(component, 'recover');

    component.submit();

    expect(reCaptchaV3Service.execute).toHaveBeenCalledWith('recover');
    expect(recoverSpy).not.toHaveBeenCalled();
  });

  afterEach(() => {
    fixture?.destroy();
  });
});
