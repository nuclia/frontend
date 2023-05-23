import { ISourceConnector, SourceConnectorDefinition, ConnectorParameters, Field } from '../models';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { getDeeplink } from '../../utils';

const SCOPE = 'https://graph.microsoft.com/files.read offline_access';

export const SharepointConnector: SourceConnectorDefinition = {
  id: 'sharepoint',
  title: 'SharePoint',
  logo: 'assets/logos/sharepoint.svg',
  description: 'Microsoft Sharepoint service',
  helpUrl: 'https://docs.nuclia.dev/docs/batch/nda/#sharepoint-connector-usage',
  factory: () => of(new SharepointImpl()),
};

const CLIENT_ID = 'SHAREPOINT_CLIENT_ID';
const TOKEN = 'SHAREPOINT_TOKEN';
const REFRESH = 'SHAREPOINT_REFRESH_TOKEN';
const CODE_VERIFIER = 'SHAREPOINT_CODE_VERIFIER';

class SharepointImpl implements ISourceConnector {
  hasServerSideAuth = true;
  isExternal = true;
  resumable = false;
  private isAuthenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  getParameters(): Observable<Field[]> {
    return of([
      {
        id: 'client_id',
        label: 'Client id',
        type: 'text',
        required: true,
      },
    ]);
  }

  handleParameters(params: ConnectorParameters) {
    localStorage.setItem(CLIENT_ID, params.client_id);
  }

  getParametersValues(): ConnectorParameters {
    return {
      client_id: localStorage.getItem(CLIENT_ID),
      token: localStorage.getItem(TOKEN),
      refresh: localStorage.getItem(REFRESH),
    };
  }

  goToOAuth(reset?: boolean) {
    if (reset) {
      localStorage.removeItem(TOKEN);
    }
    const token = localStorage.getItem(TOKEN);
    if (!token) {
      let authorizeEndpoint = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${localStorage.getItem(
        CLIENT_ID,
      )}&scope=${SCOPE}&response_type=code&response_mode=query`;
      generateCodeVerifier()
        .then((codeVerifier) => {
          localStorage.setItem(CODE_VERIFIER, codeVerifier);
          return generateCodeChallenge(codeVerifier);
        })
        .then((codeChallenge) => {
          authorizeEndpoint += `&code_challenge=${codeChallenge}&code_challenge_method=S256`;
          if ((window as any)['electron']) {
            (window as any)['electron'].openExternal(`${authorizeEndpoint}&redirect_uri=nuclia-desktop://index.html`);
          } else {
            location.href = `${authorizeEndpoint}&redirect_uri=http://localhost:4200`;
          }
        });
    } else {
      this.isAuthenticated.next(true);
    }
  }

  authenticate(): Observable<boolean> {
    if (!this.isAuthenticated.getValue()) {
      const interval = setInterval(() => {
        const deeplink = getDeeplink();
        if (deeplink && deeplink.includes('?')) {
          const params = new URLSearchParams(deeplink.split('?')[1]);
          const code = params.get('code') || '';
          clearInterval(interval);
          if (code) {
            const redirectUri = (window as any)['electron'] ? `nuclia-desktop://index.html` : `http://localhost:4200`;
            fetch(`https://login.microsoftonline.com/common/oauth2/v2.0/token`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: `client_id=${localStorage.getItem(
                CLIENT_ID,
              )}&scope=${SCOPE}&code=${code}&redirect_uri=${encodeURIComponent(
                redirectUri,
              )}&code_verifier=${localStorage.getItem(CODE_VERIFIER)}&grant_type=authorization_code`,
            })
              .then((res) => res.json())
              .then((res) => {
                if (res.access_token && res.refresh_token) {
                  localStorage.setItem(TOKEN, res.access_token);
                  localStorage.setItem(REFRESH, res.refresh_token);
                  this.isAuthenticated.next(true);
                } else {
                  this.isAuthenticated.next(false);
                }
                localStorage.removeItem(CODE_VERIFIER);
              });
          }
        }
      }, 500);
    }
    return this.isAuthenticated.asObservable();
  }
}

async function generateCodeVerifier() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateCodeChallenge(codeVerifier: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);

  const base64Url = (arrayBuffer: ArrayBuffer) => {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return base64.replace('+', '-').replace('/', '_').replace(/=+$/, '');
  };

  return base64Url(digest);
}
