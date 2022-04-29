import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { StateService, AuthService, MagicAction, SDKService } from '@flaps/auth';

@Injectable({
  providedIn: 'root',
})
export class MagicService {
  constructor(
    private authService: AuthService,
    private sdk: SDKService,
    private stateService: StateService,
    private router: Router,
  ) {}

  execute(action: MagicAction): void {
    this.authService.setNextUrl(null);
    this.stateService.dbDelStateData();
    this.stateService.cleanAccount();

    if (action.token) {
      this.sdk.nuclia.auth.authenticate(action.token);
      this.router.navigate(['/']);
    }

    if (action.action === 'edit') {
      this.router.navigate(['/edit/' + action.path]);
    }

    if (action.action === 'create') {
      this.router.navigate(['/edit/' + action.path], {
        queryParams: { create: true },
      });
    }

    if (action.action === 'goaccount' || action.action === 'gostash') {
      this.router.navigate(['/setup/invite'], {
        queryParams: { account: action.account, kb: action.stash },
      });
    }
    if (action.action === 'gosetpassword') {
      this.router.navigate(['/setup/password'], {
        queryParams: { signup: true },
      });
    }
    if (action.action === 'goselectaccount') {
      this.router.navigate(['/select']);
    }
    if (action.action === 'gosetupaccount') {
      this.router.navigate(['/setup/account']);
    }
  }
}
