import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import {
  AccountEntryContextService,
  BackendConfigurationService,
  NavigationService,
  SDKService,
  UserService,
} from '@flaps/core';
import { map, of, shareReplay, switchMap, take } from 'rxjs';
import { StandaloneService } from '../services/standalone.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class TopbarComponent {
  @Output() openNotificationPanel = new EventEmitter<void>();

  userInfo = this.userService.userInfo;

  inAdminApp = this.navigationService.inAdminApp;
  standalone = this.standaloneService.standalone;

  private backendConfig = inject(BackendConfigurationService);
  private entryContext = inject(AccountEntryContextService);
  brandName = this.backendConfig.getBrandName();
  simpleMode = this.navigationService.simpleMode;
  private isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  logoPath = this.isCowork.pipe(
    map((isCowork) => {
      if (isCowork) {
        return 'assets/logos/logo-context-box.svg';
      } else if (this.standalone) {
        return 'assets/logos/nucliadb.svg';
      } else {
        return this.backendConfig.getLogoPath();
      }
    }),
  );

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private standaloneService: StandaloneService,
  ) {}

  goToHome(): void {
    if (this.navigationService.inAdminApp) {
      this.navigationService.navigateExternal(this.entryContext.getReturnUrl());
      return;
    }

    const simpleHomeUrl$ = this.sdk.isKbLoaded
      ? this.navigationService.kbUrl
      : of(this.navigationService.getAccountSelectUrl());

    this.simpleMode
      .pipe(
        take(1),
        switchMap((simpleMode) => (simpleMode ? simpleHomeUrl$ : this.navigationService.homeUrl)),
        take(1),
      )
      .subscribe((url) => this.router.navigate([url]));
  }
}
