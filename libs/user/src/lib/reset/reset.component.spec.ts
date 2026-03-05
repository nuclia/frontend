import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@flaps/core';
import { SisToastService } from '@nuclia/sistema';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ResetComponent } from './reset.component';

describe('ResetComponent', () => {
  let component: ResetComponent;
  let fixture: ComponentFixture<ResetComponent>;

  let loginService: {
    reset: jest.Mock;
    setup: jest.Mock;
  };
  let router: { navigate: jest.Mock };
  let reCaptchaV3Service: { execute: jest.Mock };
  let toaster: { success: jest.Mock; error: jest.Mock };

  let queryParams$: BehaviorSubject<Record<string, string | undefined>>;
  let url$: BehaviorSubject<{ path: string }[]>;

  const buildComponent = async () => {
    await TestBed.configureTestingModule({
      declarations: [ResetComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: LoginService, useValue: loginService },
        { provide: ReCaptchaV3Service, useValue: reCaptchaV3Service },
        { provide: SisToastService, useValue: toaster },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParams$.asObservable(),
            url: url$.asObservable(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ResetComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => {
    loginService = {
      reset: jest.fn(() => of({ login_challenge: 'challenge-1' })),
      setup: jest.fn(() => of({ login_challenge: 'challenge-1' })),
    };
    router = { navigate: jest.fn() };
    reCaptchaV3Service = { execute: jest.fn(() => of('captcha-token')) };
    toaster = { success: jest.fn(), error: jest.fn() };
    queryParams$ = new BehaviorSubject<Record<string, string | undefined>>({ token: 'magic-token' });
    url$ = new BehaviorSubject<{ path: string }[]>([{ path: 'reset' }]);

    jest.clearAllMocks();
  });

  it('should create', async () => {
    await buildComponent();
    expect(component).toBeTruthy();
  });

  it('should initialize magic token and initFullname from route', async () => {
    await buildComponent();

    expect(component.magicToken).toBe('magic-token');
    expect(component.initFullname).toBe(false);
  });

  it('should set initFullname to true on setup url', async () => {
    url$.next([{ path: 'setup' }]);
    await buildComponent();

    expect(component.initFullname).toBe(true);
  });

  it('should do nothing on submit when form is invalid', async () => {
    await buildComponent();

    component.resetForm.setValue({ username: '', password: '', passwordConfirm: '' });
    component.submit();

    expect(reCaptchaV3Service.execute).not.toHaveBeenCalled();
    expect(component.pending).toBe(false);
  });

  it('should execute recaptcha and apply on valid submit', async () => {
    await buildComponent();
    const applySpy = jest.spyOn(component, 'apply');

    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });
    component.submit();

    expect(component.pending).toBe(false);
    expect(reCaptchaV3Service.execute).toHaveBeenCalledWith('reset');
    expect(applySpy).toHaveBeenCalledWith('captcha-token');
  });

  it('should trigger recaptcha error handler when execute fails', async () => {
    reCaptchaV3Service.execute.mockReturnValue({
      subscribe: ({ error }: { error: (err: unknown) => void }) => error(new Error('captcha failed')),
    });
    await buildComponent();
    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });

    expect(() => component.submit()).toThrow('Recaptcha error');
  });

  it('should do nothing in apply when magic token is missing', async () => {
    queryParams$.next({});
    await buildComponent();

    component.apply('captcha-token');

    expect(loginService.reset).not.toHaveBeenCalled();
    expect(loginService.setup).not.toHaveBeenCalled();
  });

  it('should call reset and navigate to login on successful apply', async () => {
    await buildComponent();

    component.pending = true;
    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });
    component.apply('captcha-token');

    expect(loginService.reset).toHaveBeenCalledWith({ password: 'Batman_123!', token: 'magic-token' }, 'captcha-token');
    expect(toaster.success).toHaveBeenCalledWith('reset.password_reset');
    expect(component.pending).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['../login'], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { login_challenge: 'challenge-1' },
    });
  });

  it('should call setup when initFullname is true', async () => {
    url$.next([{ path: 'setup' }]);
    await buildComponent();

    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });
    component.apply('captcha-token');

    expect(loginService.setup).toHaveBeenCalledWith(
      { name: 'Bruce Wayne', password: 'Batman_123!', token: 'magic-token' },
      'captcha-token',
    );
    expect(loginService.reset).not.toHaveBeenCalled();
  });

  it('should show invalid-token toast on backend 500 error', async () => {
    loginService.reset.mockReturnValue(throwError(() => ({ status: 500 })));
    await buildComponent();
    const markForCheckSpy = jest.spyOn((component as any).cdr, 'markForCheck');

    component.pending = true;
    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });
    component.apply('captcha-token');

    expect(toaster.error).toHaveBeenCalledWith('reset.invalid-token');
    expect(component.pending).toBe(false);
    expect(markForCheckSpy).toHaveBeenCalled();
  });

  it('should show generic error toast on non-500 error', async () => {
    loginService.reset.mockReturnValue(throwError(() => ({ status: 400 })));
    await buildComponent();
    const markForCheckSpy = jest.spyOn((component as any).cdr, 'markForCheck');

    component.pending = true;
    component.resetForm.setValue({
      username: 'Bruce Wayne',
      password: 'Batman_123!',
      passwordConfirm: 'Batman_123!',
    });
    component.apply('captcha-token');

    expect(toaster.error).toHaveBeenCalledWith('generic.error.oops');
    expect(component.pending).toBe(false);
    expect(markForCheckSpy).toHaveBeenCalled();
  });

  it('should navigate to login with challenge in goLogin', async () => {
    await buildComponent();

    component.goLogin('challenge-2');

    expect(router.navigate).toHaveBeenCalledWith(['../login'], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: { login_challenge: 'challenge-2' },
    });
  });
});
