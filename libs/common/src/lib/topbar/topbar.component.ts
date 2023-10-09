import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, UserService } from '@flaps/core';
import { map, take } from 'rxjs';
import { NavigationService } from '../services';
import { StandaloneService } from '../services/standalone.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent {
  userInfo = this.userService.userInfo;
  kb = this.sdk.currentKb;
  isStage = location.hostname === 'stashify.cloud';
  accountType = this.sdk.currentAccount.pipe(map((account) => account.type));
  isAccountManager = this.sdk.currentAccount.pipe(map((account) => account.can_manage_account));
  billingUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigationService.getAccountManageUrl(account.slug) + '/billing'),
  );

  standalone = this.standaloneService.standalone;
  hasValidKey = this.standaloneService.hasValidKey;
  errorMessage = this.standaloneService.errorMessage;

  showDemo = !this.standalone;

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private standaloneService: StandaloneService,
  ) {}

  goToHome(): void {
    this.navigationService.homeUrl.pipe(take(1)).subscribe((url) => {
      this.router.navigate([url]);
    });
  }

  bookDemo() {
    window.open('https://calendly.com/nuclia/30min?back=1&month=2023-10', 'blank', 'noreferrer');
  }
}
