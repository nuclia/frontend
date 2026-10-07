import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService } from '@flaps/core';
import { SamlLoginComponent } from './saml-login.component';

describe('SamlLoginComponent', () => {
  it('redirects to the product app root with the SAML reference, nonce, and target app', () => {
    const document = { location: { href: '' } } as unknown as Document;
    const route = {
      snapshot: {
        queryParams: {
          ref: 'single-use-ref',
          nonce: 'nonce-value',
          came_from: 'https://app.nuclia.io',
        },
      },
    } as unknown as ActivatedRoute;
    const config = {
      getAPIOrigin: () => 'https://accounts.nuclia.io',
    } as unknown as BackendConfigurationService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: BackendConfigurationService, useValue: config },
        { provide: DOCUMENT, useValue: document },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new SamlLoginComponent());
    component.ngOnInit();

    expect(document.location.href).toBe(
      'https://app.nuclia.io/?saml_ref=single-use-ref&nonce=nonce-value&came_from=https%3A%2F%2Fapp.nuclia.io',
    );
  });

  it('does not redirect to an untrusted product app origin', () => {
    const document = { location: { href: '' } } as unknown as Document;
    const route = {
      snapshot: {
        queryParams: {
          ref: 'single-use-ref',
          nonce: 'nonce-value',
          came_from: 'https://attacker.example.com',
        },
      },
    } as unknown as ActivatedRoute;
    const config = {
      getAPIOrigin: () => 'https://accounts.nuclia.io',
    } as unknown as BackendConfigurationService;

    TestBed.configureTestingModule({
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: BackendConfigurationService, useValue: config },
        { provide: DOCUMENT, useValue: document },
      ],
    });
    const component = TestBed.runInInjectionContext(() => new SamlLoginComponent());
    component.ngOnInit();

    expect(document.location.href).toBe('');
  });
});
