import { Component, OnInit, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SDKService, StateService } from '@flaps/core';
import { STFConfirmComponent } from '@flaps/components';
import { TranslatePipe } from '@ngx-translate/core';
import { KBStates, StatsPeriod, StatsType, Account } from '@nuclia/core';
import { filter, map, Observable, share, switchMap, combineLatest, take } from 'rxjs';
import { AppService } from '../../services/app.service';
import { HelpBoxesService } from '../../services/help-boxes.service';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-knowledge-box-home',
  templateUrl: './knowledge-box-home.component.html',
  styleUrls: ['./knowledge-box-home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KnowledgeBoxHomeComponent implements OnInit, AfterViewInit {
  locale: Observable<string> = this.app.currentLocale;
  endpoint = this.sdk.currentKb.pipe(map((kb) => kb.fullpath));
  state = this.sdk.currentKb.pipe(map((kb) => kb.state));
  stateLabel = this.state.pipe(map((state) => this.translate.transform(`stash.state.${state?.toLowerCase()}`)));
  isPublished = this.state.pipe(map((state) => state === 'PUBLISHED'));
  account = this.stateService.account.pipe(filter((account) => !!account)) as Observable<Account>;
  counters = this.sdk.counters.pipe(
    map((counters) =>
      Object.entries(counters).reduce((acc: { [key: string]: string }, [key, value]) => {
        acc[key] = value.toLocaleString();
        return acc;
      }, {}),
    ),
  );
  refreshing = this.sdk.pendingRefresh;
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
    share(),
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
  isAccountManager = this.account.pipe(map((account) => account!.can_manage_account));

  constructor(
    private app: AppService,
    private helpBoxesService: HelpBoxesService,
    private sdk: SDKService,
    private stateService: StateService,
    private translate: TranslatePipe,
    private dialog: MatDialog,
    private toaster: SisToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!this.helpBoxesService.isTourCompleted()) {
      this.helpBoxesService.initializeTour();
    }
  }

  ngAfterViewInit() {
    if (!this.helpBoxesService.isTourCompleted()) {
      this.helpBoxesService.startTour(1000);
    }
  }

  refresh() {
    this.sdk.refreshCounter(true);
  }

  publishKb() {
    this.changeState('publish', 'PUBLISHED');
  }

  retireKb() {
    this.changeState('retire', 'PRIVATE');
  }

  private changeState(actionLabel: string, state: KBStates): void {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          this.dialog
            .open(STFConfirmComponent, {
              width: '420px',
              data: {
                title: 'generic.alert',
                message: this.translate.transform(`stash.${actionLabel}.warning`, { kb: kb.title }),
                confirmText: `stash.${actionLabel}.${actionLabel}`,
              },
            })
            .afterClosed(),
        ),
        filter((result) => !!result),
        switchMap(() => this.sdk.currentKb),
        switchMap((kb) =>
          kb
            .publish(state === 'PUBLISHED')
            .pipe(switchMap(() => this.sdk.setCurrentKnowledgeBox(kb.account, kb.slug || '', true))),
        ),
        take(1),
      )
      .subscribe({
        next: () => this.cdr?.markForCheck(),
        error: () => this.toaster.error(`stash.${actionLabel}.error`),
      });
  }

  downloadDesktop() {
    window.open('https://github.com/nuclia/frontend/releases/tag/latest');
  }
}
