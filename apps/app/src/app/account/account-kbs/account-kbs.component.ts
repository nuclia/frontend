import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Observable, of, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap, shareReplay } from 'rxjs/operators';
import { Account, KBStates, WritableKnowledgeBox, IKnowledgeBoxItem } from '@nuclia/core';
import { STFConfirmComponent } from '@flaps/components';
import { Zone, ZoneService } from '@flaps/core';
import { STFTrackingService, StateService, SDKService } from '@flaps/core';
import { NavigationService } from '../../services/navigation.service';
import { KbAddComponent, KbAddData } from './kb-add/kb-add.component';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-account-kbs',
  templateUrl: './account-kbs.component.html',
  styleUrls: ['./account-kbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountKbsComponent implements OnInit, OnDestroy {
  @Input() zones: Zone[] | undefined;
  isLoading = false;
  account?: Account;
  knowledgeBoxes: IKnowledgeBoxItem[] | undefined;
  maxKnowledgeBoxes: number = 1;
  isUsersEnabled = this.tracking.isFeatureEnabled('manage-users').pipe(shareReplay(1));
  canAddKb = this.stateService.account.pipe(
    filter((account) => !!account),
    map((account) => account!.can_manage_account),
  );
  unsubscribeAll = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private navigation: NavigationService,
    private router: Router,
    private dialog: MatDialog,
    private stateService: StateService,
    private zoneService: ZoneService,
    private tracking: STFTrackingService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sdk: SDKService,
  ) {}

  ngOnInit(): void {
    const account$ = this.stateService.account.pipe(
      filter((account): account is Account => !!account),
      take(1),
    );
    const zones$ = this.zones ? of(this.zones) : this.zoneService.getZones().pipe(take(1));
    forkJoin([account$, zones$])
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(([account, zones]) => {
          this.account = account;
          this.maxKnowledgeBoxes = account.max_kbs;
          this.zones = zones;
          return this.updateKbs();
        }),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
      });
    // TODO: if no kbs, we should display to the default Empty page
  }

  updateKbs(): Observable<IKnowledgeBoxItem[]> {
    return this.sdk.nuclia.db.getKnowledgeBoxes(this.account!.slug).pipe(
      map((kbs) => kbs.sort((a, b) => (a.title || '').localeCompare(b.title || ''))),
      tap((kbs) => {
        this.knowledgeBoxes = kbs;
      }),
    );
  }

  manageKb(slug: string): void {
    this.router.navigate([this.navigation.getKbMangeUrl(this.account!.slug, slug)]);
  }

  manageKbUsers(slug: string): void {
    this.router.navigate([this.navigation.getKbUsersUrl(this.account!.slug, slug)]);
  }

  addKb(zones: Zone[], account: Account) {
    const data: KbAddData = {
      zones: zones,
      account: account,
    };
    this.dialog
      .open(KbAddComponent, { width: '780px', data: data })
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => {
          if (result?.success === false) {
            this.toaster.error('stash.create.failure');
          }
          return !!result?.success;
        }),
        switchMap(() => this.updateKbs()),
      )
      .subscribe(() => this.cdr?.markForCheck());
  }

  publishKb(kb: IKnowledgeBoxItem) {
    this.changeState(kb, 'publish', 'PUBLISHED');
  }

  retireKb(kb: IKnowledgeBoxItem) {
    this.changeState(kb, 'retire', 'PRIVATE');
  }

  private changeState(kb: IKnowledgeBoxItem, actionLabel: string, state: KBStates): void {
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'generic.alert',
        message$: this.translate.get(`stash.${actionLabel}.warning`, { kb: kb.title }),
        confirmText: `stash.${actionLabel}.${actionLabel}`,
      },
    });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => !!result),
        switchMap(() => {
          this.setLoading(true);
          return new WritableKnowledgeBox(this.sdk.nuclia, this.account!.slug, kb).modify({ state });
        }),
        switchMap(() => this.updateKbs()),
      )
      .subscribe({
        next: () => this.setLoading(false),
        error: () => {
          this.setLoading(false);
          this.toaster.error(`stash.${actionLabel}.error`);
        },
      });
  }

  deleteKb(kb: IKnowledgeBoxItem) {
    const dialogRef = this.dialog.open(STFConfirmComponent, {
      width: '420px',
      data: {
        title: 'generic.alert',
        message$: this.translate.get('stash.delete.warning', { kb: kb.title }),
        confirmText: 'stash.delete.delete',
      },
    });
    dialogRef
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => !!result),
        switchMap(() => {
          this.setLoading(true);
          return new WritableKnowledgeBox(this.sdk.nuclia, this.account!.slug, kb).delete();
        }),
        switchMap(() => this.updateKbs()),
      )
      .subscribe({
        next: () => this.setLoading(false),
        error: () => {
          this.setLoading(false);
          this.toaster.error('stash.delete.error');
        },
      });
  }

  getKbUrl(accountSlug: string, kbSlug: string): string {
    return this.navigation.getKbUrl(accountSlug, kbSlug);
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
    this.cdr?.markForCheck();
  }
}
