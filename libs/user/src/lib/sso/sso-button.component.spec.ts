import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoButtonComponent } from './sso-button.component';
import { MockModule, MockProvider } from 'ng-mocks';
import { SsoService } from '@flaps/core';
import { PaIconModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';
import { WINDOW } from '@ng-web-apis/common';
import { TranslateService } from '@ngx-translate/core';

describe('SsoButtonComponent', () => {
  let component: SsoButtonComponent;
  let fixture: ComponentFixture<SsoButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaIconModule), MockModule(PaTranslateModule)],
      declarations: [SsoButtonComponent],
      providers: [
        MockProvider(SsoService, { getSsoLoginUrl: jest.fn((provider) => `sso/login/${provider}`) }),
        MockProvider(WINDOW, { location: { href: '' } } as Window),
        MockProvider(TranslateService, {
          instant: jest.fn((key) => `translate--${key}`),
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
