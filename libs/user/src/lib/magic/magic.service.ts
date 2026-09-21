import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, OAuthService, SDKService } from '@flaps/core';
import { MagicAction } from '@nuclia/core';
import { catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MagicService {
  cameFrom = '';
  readyToLogin = false;

  constructor(
    private authService: AuthService,
    private sdk: SDKService,
    private router: Router,
    private oAuthService: OAuthService,
  ) {}

  execute(action: MagicAction) {
    this.authService.setNextUrl(null);
    this.sdk.cleanAccount();
    this.cameFrom = action.came_from || '';
    if (action.came_from) {
      this.oAuthService.setCameFrom(action.came_from);
    }

    if (action.action === 'join_regional_kb') {
      // Action to join a kb has a different flow
      if (action.login_token) {
        this.sdk.nuclia.auth.authenticate(action.login_token);
      }
      return this.joinKb(action).pipe(map(() => undefined));
    } else {
      if (action.token) {
        this.sdk.nuclia.auth.authenticate(action.token);
      }
      this._execute(action);
      return of(undefined);
    }
  }

  private _execute(action: MagicAction): void {
    switch (action.action) {
      case 'create':
        this.router.navigate(['/edit/' + action.path], {
          queryParams: { create: true },
        });
        break;
      case 'edit':
        this.router.navigate(['/edit/' + action.path]);
        break;
      case 'goaccount':
        if (action.needs_initial_setpassword === false && this.cameFrom) {
          this.goToCameFromWithMessage('/select', 'login.invite_accepted_please_login');
        } else {
          this.router.navigate(['/setup/invite'], {
            queryParams: { account: action.account },
          });
        }
        break;
      case 'redict_to_kb':
        if (action.needs_initial_setpassword === false && this.cameFrom) {
          this.goToCameFromWithMessage('/select', 'login.invite_accepted_please_login');
        } else {
          this.router.navigate(['/setup/invite'], {
            queryParams: { account: action.account, kb: action.kb },
          });
        }
        break;
      case 'goselectaccount':
        this.router.navigate(['/select']);
        break;
      case 'gosetpassword':
        this.router.navigate(['/setup/password'], {
          queryParams: { signup: true },
        });
        break;
      case 'gosetupaccount':
      case 'startonboarding':
        if (action.consent_url) {
          location.href = action.consent_url;
        } else {
          throw new Error('No consent_url');
        }
        break;
      case 'account_ready_please_login':
        // login_challenge expired after verification, but the account/password are already set.
        this.readyToLogin = true;
        break;
    }
  }

  private goToCameFromWithMessage(path: string, message: string) {
    // The invited user has no session yet, so cameFrom's own auth guard will bounce them into
    // login; forward `message` so it survives that redirect and shows up on the login screen.
    const url = new URL(`${this.cameFrom}${path}`);
    url.searchParams.set('message', message);
    location.href = url.toString();
  }

  joinKb(action: MagicAction) {
    return this.validateToken(action.join_kb_token || '', action.zone).pipe(
      tap((nextAction) => this._execute(nextAction)),
    );
  }

  validateToken(token: string, zone?: string) {
    return this.sdk.nuclia.auth.validateMagicToken(token, zone).pipe(
      catchError((error) => {
        // error is `{ status, body }`, with body already parsed by the SDK's fetch() helper.
        throw Object.assign(new Error('Token validation error'), { tokenError: error?.body || {} });
      }),
    );
  }
}
