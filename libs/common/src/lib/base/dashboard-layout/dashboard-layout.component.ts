import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { combineLatest, map, startWith } from 'rxjs';
import { PENDING_RESOURCES_LIMIT, UploadService } from '../../upload';
import { DashboardLayoutService } from './dashboard-layout.service';
import { NavigationService } from '@flaps/core';

@Component({
  selector: 'stf-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class DashboardLayoutComponent {
  private uploadService = inject(UploadService);
  private navigationService = inject(NavigationService);
  private layoutService = inject(DashboardLayoutService);

  showProgress = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );
  pendingResourceslimit = PENDING_RESOURCES_LIMIT;
  showLimit = this.uploadService.pendingResourcesLimitExceeded;
  showStatusBar = combineLatest([this.showLimit.pipe(startWith(false)), this.showProgress.pipe(startWith(false))]).pipe(
    map(([showLimit, showProgress]) => showLimit || showProgress),
  );
  collapsedNav = this.layoutService.collapsedNav;
  // The sidebar is hidden when in simple mode (ContextBox/cowork) outside an ARAG space,
  // OR when anywhere under /manage (all account-management routes are full-width).
  // IN_ACCOUNT_MANAGEMENT regex matches ALL /manage/* paths, so no manage route has a sidebar.
  noNavBar = combineLatest([
    this.navigationService.simpleMode,
    this.navigationService.inArag(),
    this.navigationService.inAccount,
  ]).pipe(map(([simple, inArag, inHome]) => (simple && !inArag) || inHome));
}
