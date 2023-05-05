import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService, STFTrackingService, UserService } from '@flaps/core';
import { map, shareReplay, take } from 'rxjs';
import { NavigationService } from '../services';

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
  standalone = this.sdk.nuclia.options.standalone;
  accountType = this.sdk.currentAccount.pipe(map((account) => account.type));
  isBillingEnabled = this.tracking.isFeatureEnabled('billing').pipe(shareReplay(1));
  billingUrl = this.sdk.currentAccount.pipe(
    map((account) => this.navigationService.getAccountManageUrl(account.slug) + '/billing'),
  );

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private tracking: STFTrackingService,
  ) {}

  goToHome(): void {
    this.navigationService.homeUrl.pipe(take(1)).subscribe((url) => {
      this.router.navigate([url]);
    });
  }
}
