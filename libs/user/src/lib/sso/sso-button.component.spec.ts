import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventEmitter } from '@angular/core';
import { SsoService } from '@flaps/core';
import { WINDOW } from '@ng-web-apis/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SvgIconRegistryService } from 'angular-svg-icon';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { SsoButtonComponent } from './sso-button.component';

describe('SsoButtonComponent', () => {
  let component: SsoButtonComponent;
  let fixture: ComponentFixture<SsoButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SsoButtonComponent, TranslateModule.forRoot()],
      providers: [
        MockProvider(SsoService, { getSsoLoginUrl: jest.fn((provider) => of(`sso/login/${provider}`)) }),
        MockProvider(WINDOW, { location: { href: '' } } as Window),
        {
          provide: SvgIconRegistryService,
          useValue: {
            loadSvg: () => {
              /* empty */
            },
          },
        },
        MockProvider(TranslateService, {
          instant: jest.fn((key) => `translate--${key}`),
          get: jest.fn((key) => of(`translate--${key}`)),
          onTranslationChange: new EventEmitter(),
          onLangChange: new EventEmitter(),
          onDefaultLangChange: new EventEmitter(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SsoButtonComponent);
    component = fixture.componentInstance;
  });

  it('should display the icon and capitalized text corresponding to the provider', () => {
    expect(component.icon).toBe(`assets/sso-icons/google.svg`);
    expect(component.providerName).toBe(`Google`);

    component.provider = 'github';
    expect(component.icon).toBe(`assets/sso-icons/github.svg`);
    expect(component.providerName).toBe(`Github`);

    component.provider = 'microsoft';
    expect(component.icon).toBe(`assets/sso-icons/microsoft.svg`);
    expect(component.providerName).toBe(`Microsoft`);
  });

  it('should translate google workspace on signup', () => {
    component.signup = true;
    expect(component.icon).toBe(`assets/sso-icons/google.svg`);
    expect(component.providerName).toBe(`translate--login.google-workspace`);

    component.provider = 'github';
    expect(component.icon).toBe(`assets/sso-icons/github.svg`);
    expect(component.providerName).toBe(`Github`);

    component.provider = 'microsoft';
    expect(component.icon).toBe(`assets/sso-icons/microsoft.svg`);
    expect(component.providerName).toBe(`Microsoft`);
  });

  it('should redirect to sso login URL when clicking on the button', () => {
    const window = TestBed.inject(WINDOW);
    component.provider = 'github';
    fixture.detectChanges();
    fixture.debugElement.nativeElement.querySelector('button').click();
    expect(window.location.href).toBe('sso/login/github');
  });
});
