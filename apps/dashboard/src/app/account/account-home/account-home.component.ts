import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, UsageType } from '@nuclia/core';
import { filter, switchMap, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { MetricsService } from '../metrics.service';
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
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);
  period = this.metrics.subscriptionPeriod;

  kbs = this.sdk.kbList;

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

  goToKb(account: string, kb: IKnowledgeBoxItem) {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(account, kb.slug || '')]);
  }
}
