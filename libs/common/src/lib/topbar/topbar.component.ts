import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AccountEntryContextService, BrandService, NavigationService, SDKService, UserService } from '@flaps/core';
import { combineLatest, map, of, shareReplay, switchMap, take } from 'rxjs';
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

  private brandService = inject(BrandService);
  private entryContext = inject(AccountEntryContextService);
  brandName = this.brandService.brandName;
  simpleMode = this.navigationService.simpleMode;
  private isCowork = this.sdk.currentAccount.pipe(
    map((account) => account.workflow === 'cowork'),
    shareReplay(1),
  );
  logoPath = combineLatest([this.isCowork, this.brandService.logoPath]).pipe(
    map(([isCowork, logoPath]) => {
      if (isCowork) {
        return 'assets/logos/logo-context-box.svg';
      } else if (this.standalone) {
        return 'assets/logos/nucliadb.svg';
      } else {
        return logoPath;
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
