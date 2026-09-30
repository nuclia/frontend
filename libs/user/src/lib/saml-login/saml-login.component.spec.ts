import { ActivatedRoute } from '@angular/router';
import { SDKService } from '@flaps/core';
import { SamlLoginComponent } from './saml-login.component';

describe('SamlLoginComponent', () => {
  it('starts OAuth with the SAML reference, nonce, and target app in state', () => {
    const redirectToOAuth = jest.fn();
    const route = {
      snapshot: {
        queryParams: {
          ref: 'single-use-ref',
          nonce: 'nonce-value',
          came_from: 'https://app.nuclia.io',
        },
      },
    } as unknown as ActivatedRoute;
    const sdk = {
      nuclia: { auth: { redirectToOAuth } },
    } as unknown as SDKService;

    new SamlLoginComponent(route, sdk).ngOnInit();

    expect(redirectToOAuth).toHaveBeenCalledWith({
      saml_ref: 'single-use-ref',
      nonce: 'nonce-value',
      came_from: 'https://app.nuclia.io',
    });
  });
});