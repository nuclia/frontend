import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService, LoginService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';

import { SisModalService } from '@nuclia/sistema';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { RecoverComponent } from './recover.component';

describe('RecoverComponent', () => {
  let component: RecoverComponent;
  let fixture: ComponentFixture<RecoverComponent>;
  let queryParams$: BehaviorSubject<{ login_challenge?: string; isPasswordInit?: boolean }>;

  let loginService: { recover: Mock };
  let reCaptchaV3Service: { execute: Mock };
  let config: { getRecaptchaKey: Mock; getAppName: Mock };
  let modalService: { openConfirm: Mock };
  let translateService: { get: Mock };
  beforeEach(async () => {
    queryParams$ = new BehaviorSubject<{ login_challenge?: string; isPasswordInit?: boolean }>({
      login_challenge: 'challenge-1',
      isPasswordInit: true,
    });

    loginService = {
      recover: vi.fn(() => of({ action: 'check-mail' })),
    };

    reCaptchaV3Service = {
      execute: vi.fn(() => of('captcha-token')),
    };

    config = {
      getRecaptchaKey: vi.fn(() => 'key'),
      getAppName: vi.fn(() => 'platform'),
    };

    modalService = {
      openConfirm: vi.fn(() => ({ onClose: of(undefined) })),
    };

    translateService = {
      get: vi.fn(() => of('translated-message')),
    };

    TestBed.configureTestingModule({
      imports: [RecoverComponent, ReactiveFormsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { queryParams: queryParams$.asObservable() },
        },
        { provide: LoginService, useValue: loginService },
        { provide: ReCaptchaV3Service, useValue: reCaptchaV3Service },
        { provide: BackendConfigurationService, useValue: config },
        { provide: SisModalService, useValue: modalService },
        { provide: TranslateService, useValue: translateService },
      ],
    })
      .overrideComponent(RecoverComponent, {
        set: { template: '' },
      })
      .compileComponents();
  });

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
    const recoverSpy = vi.spyOn(component, 'recover');
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
    const recoverSpy = vi.spyOn(component, 'recover');
    vi.useFakeTimers();

    try {
      component.submit();

      // RxJS reports errors thrown from a subscriber's error callback asynchronously.
      expect(() => vi.runAllTimers()).toThrow('Recaptcha error');
    } finally {
      vi.useRealTimers();
    }

    expect(reCaptchaV3Service.execute).toHaveBeenCalledWith('recover');
    expect(recoverSpy).not.toHaveBeenCalled();
  });

  afterEach(() => {
    fixture?.destroy();
  });
});
