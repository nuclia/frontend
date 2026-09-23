import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AccountEntryContextService, BrandService, NavigationService, SDKService, UserService } from '@flaps/core';
import { combineLatest, map, of, shareReplay, switchMap, take } from 'rxjs';
import { StandaloneService } from '../services/standalone.service';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import { PlanStatusComponent } from './plan-status/plan-status.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { StandaloneMenuComponent } from './standalone-menu/standalone-menu.component';
import { AsyncPipe } from '@angular/common';

@Component({
    selector: 'app-topbar',
    templateUrl: './topbar.component.html',
    styleUrls: ['./topbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        KbSwitchComponent,
        PlanStatusComponent,
        UserMenuComponent,
        StandaloneMenuComponent,
        AsyncPipe,
    ],
})
export class TopbarComponent {
  @Output() openNotificationPanel = new EventEmitter<void>();

  userInfo = this.userService.userInfo;

  inAdminApp = this.navigationService.inAdminApp;
  showKbSwitch =
    !this.inAdminApp || this.navigationService.fromApp('rao') || this.navigationService.fromApp('dashboard');
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
