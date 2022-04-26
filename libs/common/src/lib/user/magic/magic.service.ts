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

    if (action.action === 'edit') {
      this.authService.setNextUrl('/edit/' + action.path);
    }

    if (action.action === 'create') {
      this.authService.setNextUrl('/edit/' + action.path);
      this.authService.setNextParams({
        create: true,
      });
    }

    if (action.action === 'goaccount' || action.action === 'gostash') {
      this.authService.setNextUrl('/setup/invite');
      this.authService.setNextParams({ account: action.account, kb: action.stash });
    }
    if (action.action === 'gosetpassword') {
      this.authService.setNextUrl('/setup/password');
      this.authService.setNextParams({ signup: true });
    }
    if (action.action === 'goselectaccount') {
      this.authService.setNextUrl('/select');
    }
    if (action.action === 'gosetupaccount') {
      this.authService.setNextUrl('/setup/account');
    }
    if (action.action === 'login') {
      this.authService.setNextUrl(action.then!);
      this.router.navigate(['/user/login']);
    }

    if (action.token) {
      this.sdk.nuclia.auth.authenticate(action.token);
    }
  }
}
