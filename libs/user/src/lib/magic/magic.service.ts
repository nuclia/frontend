import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, SDKService } from '@flaps/core';
import { MagicAction } from '@nuclia/core';
import { catchError, map, of, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MagicService {
  constructor(
    private authService: AuthService,
    private sdk: SDKService,
    private router: Router,
  ) {}

  execute(action: MagicAction) {
    this.authService.setNextUrl(null);
    this.sdk.cleanAccount();

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
        this.router.navigate(['/setup/invite'], {
          queryParams: { account: action.account },
        });
        break;
      case 'redict_to_kb':
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
        this.router.navigate(['/user/onboarding']);
        break;
    }
  }

  joinKb(action: MagicAction) {
    return this.validateToken(action.join_kb_token || '').pipe(tap((nextAction) => this._execute(nextAction)));
  }

  validateToken(token: string) {
    return this.sdk.nuclia.auth.validateMagicToken(token).pipe(
      catchError((error) => {
        throw { tokenError: error };
      }),
    );
  }
}
