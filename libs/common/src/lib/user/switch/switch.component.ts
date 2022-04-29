import { Component } from '@angular/core';
import { AuthService, SDKService, StateService } from '@flaps/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-switch',
  templateUrl: './switch.component.html',
  styleUrls: ['./switch.component.scss'],
})
export class SwitchComponent {
  loaded = false;
  message: string | undefined;
  accounts = this.sdk.nuclia.db.getAccounts();

  constructor(
    private auth: AuthService,
    private state: StateService,
    private router: Router,
    private sdk: SDKService,
  ) {}

  goToAccount() {
    this.auth.setNextParams(null);
    this.auth.setNextUrl('/');
    this.state.cleanStash();
  }

  logout() {
    this.router.navigate(['/user/logout']);
  }
}
