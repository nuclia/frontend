import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Account, Counters, KBStates, StatsPeriod, StatsType } from '@nuclia/core';
import { combineLatest, filter, map, Observable, share, shareReplay, switchMap, take, tap } from 'rxjs';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { markForCheck } from '@guillotinaweb/pastanaga-angular';
import { AppService, DesktopUploadService, NavigationService } from '@flaps/common';
import { UPGRADABLE_ACCOUNT_TYPES } from '../../account/billing/billing.service';

@Component({
  selector: 'app-knowledge-box-home',
  templateUrl: './knowledge-box-home.component.html',
  styleUrls: ['./knowledge-box-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxHomeComponent {
  locale: Observable<string> = this.app.currentLocale;
  endpoint = this.sdk.currentKb.pipe(map((kb) => kb.fullpath));
  state = this.sdk.currentKb.pipe(map((kb) => kb.state));
  stateLabel = this.state.pipe(map((state) => this.translate.transform(`stash.state.${state?.toLowerCase()}`)));
  isPublished = this.state.pipe(map((state) => state === 'PUBLISHED'));
  account = this.stateService.account.pipe(filter((account) => !!account)) as Observable<Account>;
  counters: Observable<Counters> = this.sdk.counters;
  private _processing = combineLatest([this.account, this.sdk.currentKb]).pipe(
    switchMap(([account, kb]) =>
      this.sdk.nuclia.db.getStats(account!.slug, StatsType.PROCESSING_TIME, kb.id, StatsPeriod.YEAR),
    ),
    share(),
  );
  processing = this._processing.pipe(
    map((stats) =>
      stats
        .map((stat) => [new Date(stat.time_period), stat.stats] as [Date, number])
        .map(
          (stat) =>
            [
              `${(stat[0].getMonth() + 1).toLocaleString(undefined, { minimumIntegerDigits: 2 })}/${
                stat[0].getFullYear() % 100
              }`,
              stat[1],
            ] as [string, number],
        )
        .reverse(),
    ),
  );
  private _search = combineLatest([this.account, this.sdk.currentKb]).pipe(
    switchMap(([account, kb]) =>
      this.sdk.nuclia.db.getStats(account!.slug, StatsType.SEARCHES, kb.id, StatsPeriod.YEAR),
    ),
    shareReplay(),
  );
  totalSearch = this._search.pipe(map((stats) => stats.reduce((acc, stat) => acc + stat.stats, 0)));
  search = this._search.pipe(
    map((stats) =>
      stats
        .map((stat) => [new Date(stat.time_period), stat.stats] as [Date, number])
        .map(
          (stat) =>
            [
              `${(stat[0].getMonth() + 1).toLocaleString(undefined, { minimumIntegerDigits: 2 })}/${
                stat[0].getFullYear() % 100
              }`,
              stat[1],
            ] as [string, number],
        )
        .reverse(),
    ),
  );
  isKbAdmin = this.sdk.currentKb.pipe(map((kb) => !!kb.admin));
  isKbContrib = this.sdk.currentKb.pipe(map((kb) => !!kb.admin || !!kb.contrib));
  kbUrl = this.sdk.currentKb.pipe(
    map((kb) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.navigationService.getKbUrl(kb.account, kbSlug);
    }),
  );
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));
  isDownloadDesktopEnabled = this.tracking.isFeatureEnabled('download-desktop-app');
  canUpgrade = combineLatest([this.isAccountManager, this.account]).pipe(
    map(([isAccountManager, account]) => isAccountManager && UPGRADABLE_ACCOUNT_TYPES.includes(account.type)),
  );
  clipboardSupported: boolean = !!(navigator.clipboard && navigator.clipboard.writeText);
  copyIcon = 'copy';

  constructor(
    private app: AppService,
    private sdk: SDKService,
    private stateService: StateService,
    private translate: TranslatePipe,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
    private modalService: SisModalService,
    private tracking: STFTrackingService,
    private navigationService: NavigationService,
  ) {}

  toggleKbState() {
    this.isPublished.pipe(take(1)).subscribe((isPublished) => {
      const label = isPublished ? 'retire' : 'publish';
      const state = isPublished ? 'PRIVATE' : 'PUBLISHED';
      return this.changeState(label, state);
    });
  }

  private changeState(actionLabel: string, state: KBStates): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap(
          (kb) =>
            this.modalService.openConfirm({
              title: `stash.${actionLabel}.${actionLabel}`,
              description: this.translate.transform(`stash.${actionLabel}.warning`, { kb: kb.title }),
            }).onClose,
        ),
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        switchMap((kb) => kb.publish(state === 'PUBLISHED').pipe(tap(() => this.sdk.refreshKbList(true)))),
        take(1),
      )
      .subscribe({
        next: () => this.cdr?.markForCheck(),
        error: () => this.toaster.error(`stash.${actionLabel}.error`),
      });
  }

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => {
      navigator.clipboard.writeText(endpoint);
      this.copyIcon = 'check';
      markForCheck(this.cdr);
      setTimeout(() => {
        this.copyIcon = 'copy';
        markForCheck(this.cdr);
      }, 1000);
    });
  }

  protected readonly DesktopUploadService = DesktopUploadService;
}
