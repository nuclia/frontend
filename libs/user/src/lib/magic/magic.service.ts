import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SDKService } from '@flaps/core';
import { MagicAction } from '@nuclia/core';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';

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
  ) {}

  execute(action: MagicAction) {
    this.authService.setNextUrl(null);
    this.sdk.cleanAccount();
    this.cameFrom = action.came_from || '';

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
          location.href = `${this.cameFrom}/select`;
        } else if (action.needs_initial_setpassword === true && this.cameFrom) {
          // Modern invite flow: user has no session token yet. Go directly to set-password
          // in the target app so SetPasswordComponent starts the OAuth flow with
          // `initial_setpassword: true` in the state — creating a valid login_challenge
          // that the backend can embed in the setup email.
          // Navigating to the authGuard-protected /setup/invite would cause a redirect
          // loop for unauthenticated users, losing the initial_setpassword context.
          location.href = `${this.cameFrom}/user/set-password`;
        } else {
          this.router.navigate(['/setup/invite'], {
            queryParams: { account: action.account },
          });
        }
        break;
      case 'redict_to_kb':
        // needs_initial_setpassword property is not avaiable, so we don't know if it's a new user or not
        this.router.navigate(['/setup/invite'], {
          queryParams: { account: action.account, kb: action.kb },
        });
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

  joinKb(action: MagicAction) {
    return this.validateToken(action.join_kb_token || '', action.zone).pipe(
      tap((nextAction) => this._execute(nextAction)),
    );
  }

  validateToken(token: string, zone?: string) {
    return this.sdk.nuclia.auth.validateMagicToken(token, zone).pipe(
      catchError((error) => {
        // error is the raw fetch Response; parse its JSON body so callers can read `.detail`.
        return from(error instanceof Response ? error.json().catch(() => ({})) : Promise.resolve({})).pipe(
          switchMap((body) => {
            throw Object.assign(new Error('Token validation error'), { tokenError: body });
          }),
        );
      }),
    );
  }
}
