import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, UsagePoint, UsageType } from '@nuclia/core';
import { filter, forkJoin, map, shareReplay, switchMap, take } from 'rxjs';
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
  totalQueries = this.metrics.getUsageCount(UsageType.SEARCHES_PERFORMED);
  period = this.metrics.period;

  kbs = this.sdk.kbList;
  usage?: { [key: string]: UsagePoint[] };
  tokensCount?: { [key: string]: number };

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

    this.getUsageMap().subscribe((usage) => {
      this.usage = usage;
      this.tokensCount = Object.entries(usage).reduce(
        (acc, [key, value]) => {
          acc[key] = value[0].metrics.find((metric) => metric.name === 'nuclia_tokens_billed')?.value || 0;
          return acc;
        },
        {} as { [key: string]: number },
      );
      this.cdr.markForCheck();
    });
  }

  getUsageMap() {
    return forkJoin([this.account$.pipe(take(1)), this.period.pipe(take(1)), this.kbs.pipe(take(1))]).pipe(
      switchMap(([account, period, kbs]) => {
        const to = new Date();
        const requests = kbs
          .map((kb) =>
            this.sdk.nuclia.db
              .getUsage(account.id, period?.start.toISOString() || '', to.toISOString(), kb.id)
              .pipe(map((usage) => ({ key: kb.id, usage }))),
          )
          .concat([
            this.sdk.nuclia.db
              .getUsage(account.id, period?.start.toISOString() || '', to.toISOString())
              .pipe(map((usage) => ({ key: 'account', usage }))),
          ]);
        return forkJoin(requests);
      }),
      map((usage) =>
        usage.reduce(
          (acc, curr) => {
            acc[curr.key] = curr.usage;
            return acc;
          },
          {} as { [key: string]: UsagePoint[] },
        ),
      ),
      shareReplay(1),
    );
  }

  goToKb(account: string, kb: IKnowledgeBoxItem) {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(account, kb.slug || '')]);
  }
}
