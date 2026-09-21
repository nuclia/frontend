import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { combineLatest, map, startWith, take } from 'rxjs';
import { PENDING_RESOURCES_LIMIT, UploadService } from '../../upload';
import { DashboardLayoutService } from './dashboard-layout.service';
import { NavigationService, SDKService } from '@flaps/core';
import { SisModalService } from '@nuclia/sistema';
import { EulaModalComponent } from '../../onboarding/eula-modal/eula-modal.component';

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
  private modalService = inject(SisModalService);
  private sdk = inject(SDKService);

  showProgress = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );
  pendingResourceslimit = PENDING_RESOURCES_LIMIT;
  showLimit = this.uploadService.pendingResourcesLimitExceeded;
  showStatusBar = combineLatest([this.showLimit.pipe(startWith(false)), this.showProgress.pipe(startWith(false))]).pipe(
    map(([showLimit, showProgress]) => showLimit || showProgress),
  );
  collapsedNav = this.layoutService.collapsedNav;
  // Hidden in simple mode outside ARAG, or anywhere under /manage (account-management routes
  // are full-width).
  noNavBar = combineLatest([this.navigationService.simpleMode, this.navigationService.inArag()]).pipe(
    map(([simple, inArag]) => (simple && !inArag) || this.navigationService.inAdminApp),
  );

  constructor() {
    // EULA gating is skipped in `admin` — forcing PDP Studio users through it is unresolved.
    if (this.navigationService.inAdminApp) {
      return;
    }
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      if (account.can_manage_account && !account.eula_accepted) {
        this.modalService.openModal(EulaModalComponent, { dismissable: false });
      }
    });
  }
}
