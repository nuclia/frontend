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
  noNavBar = combineLatest([
    this.navigationService.simpleMode,
    this.navigationService.inAccount,
    this.navigationService.inArag(),
  ]).pipe(map(([simple, inAccount, inArag]) => simple && !inAccount && !inArag));
}
