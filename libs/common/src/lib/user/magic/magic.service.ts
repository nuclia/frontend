import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, MagicAction, SDKService, StateService } from '@flaps/core';

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
      case 'gostash':
        this.router.navigate(['/setup/invite'], {
          queryParams: { account: action.account, kb: action.stash },
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
        this.router.navigate(['/setup/account']);
        break;
      case 'startonboarding':
        this.router.navigate(['/user/onboarding']);
        break;
    }
  }
}
