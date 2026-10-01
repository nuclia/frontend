import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { Router } from '@angular/router';
import { AccountEntryContextService, BrandService, NavigationService, SDKService, UserService } from '@flaps/core';
import { combineLatest, map, of, switchMap, take } from 'rxjs';
import { StandaloneService } from '../services/standalone.service';
import { KbSwitchComponent } from './kb-switch/kb-switch.component';
import { PlanStatusComponent } from './plan-status/plan-status.component';
import { StandaloneMenuComponent } from './standalone-menu/standalone-menu.component';
import { UserMenuComponent } from './user-menu/user-menu.component';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KbSwitchComponent, PlanStatusComponent, UserMenuComponent, StandaloneMenuComponent, AsyncPipe],
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
  contextBoxMode = this.navigationService.contextBoxMode;
  logoPath = combineLatest([this.contextBoxMode, this.brandService.logoPath]).pipe(
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

    const contextBoxHomeUrl$ = this.sdk.isKbLoaded
      ? this.navigationService.kbUrl
      : of(this.navigationService.getAccountSelectUrl());

    this.contextBoxMode
      .pipe(
        take(1),
        switchMap((contextBoxMode) => (contextBoxMode ? contextBoxHomeUrl$ : this.navigationService.homeUrl)),
        take(1),
      )
      .subscribe((url) => this.router.navigate([url]));
  }
}
