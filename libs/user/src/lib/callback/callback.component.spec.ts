import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BackendConfigurationService, SAMLService, SsoService } from '@flaps/core';
import { of } from 'rxjs';

import { RouterModule } from '@angular/router';
import { CallbackComponent } from './callback.component';

describe('CallbackComponent', () => {
  let component: CallbackComponent;
  let fixture: ComponentFixture<CallbackComponent>;

  const token = 'saml_token';

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CallbackComponent],
      imports: [RouterModule.forRoot([])],
      providers: [
        { provide: SAMLService, useValue: { getToken: () => of(token) } },
        { provide: SsoService, useValue: { login: () => of() } },
        {
          provide: BackendConfigurationService,
          useValue: {
            getAllowedHostsRedirect: () => [],
            getAPIURL: () => '',
            staticConf: { client: 'dashboard' },
            getOAuthSettings: () => ({
              client_id: 'abc123',
              hydra: 'http://oauth.here',
              auth: 'http://auth.here',
            }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CallbackComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
