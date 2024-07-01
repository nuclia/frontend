import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, UsageType } from '@nuclia/core';
import { filter, Observable, switchMap, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { ChartData, MetricsService } from '../metrics.service';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { InviteCollaboratorsModalComponent } from '../invite-collaborators-modal';

@Component({
  selector: 'app-account-home',
  templateUrl: './account-home.component.html',
  styleUrls: ['./account-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountHomeComponent implements OnInit {
  account$ = this.metrics.account$;
  canUpgrade = this.metrics.canUpgrade;
  isSubscribed = this.metrics.isSubscribed;
  usage = this.metrics.accountUsage;
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);

  kbs = this.sdk.kbList;
  usageTypes = [UsageType.SEARCHES_PERFORMED, UsageType.SLOW_PROCESSING_TIME];

  allCharts = true;
  charts: Observable<Partial<{ [key in UsageType]: ChartData }>> = this.metrics.getCumulativeUsageCharts();

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
    private navigation: NavigationService,
    private router: Router,
    private metrics: MetricsService,
    private route: ActivatedRoute,
    private modal: SisModalService,
  ) {}

  ngOnInit() {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => params['setup'] === 'invite-collaborators'),
        switchMap(() => this.route.params),
      )
      .subscribe((params) => {
        this.modal.openModal(
          InviteCollaboratorsModalComponent,
          new ModalConfig({ dismissable: false, data: { accountSlug: params['account'] } }),
        );
      });
  }

  toggleCharts() {
    this.allCharts = !this.allCharts;
    this.cdr.markForCheck();
  }

  goToKb(account: string, kb: IKnowledgeBoxItem) {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(account, kb.slug || '')]);
  }
}
