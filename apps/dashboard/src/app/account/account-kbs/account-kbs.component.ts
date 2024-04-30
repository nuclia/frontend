import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Subject, tap } from 'rxjs';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { Account, IKnowledgeBoxItem, KBStates, WritableKnowledgeBox } from '@nuclia/core';
import { FeaturesService, NavigationService, SDKService, Zone, ZoneService } from '@flaps/core';
import { UsersDialogComponent } from './users-dialog/users-dialog.component';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { KbAddData, KbAddModalComponent } from '@flaps/common';

@Component({
  templateUrl: './account-kbs.component.html',
  styleUrls: ['./account-kbs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountKbsComponent implements OnInit, OnDestroy {
  zones: Zone[] = [];
  isLoading = false;
  account?: Account;
  knowledgeBoxes: IKnowledgeBoxItem[] | undefined;
  maxKnowledgeBoxes: number = 1;
  canAddKb = this.features.isAccountManager;
  unsubscribeAll = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private navigation: NavigationService,
    private router: Router,
    private zoneService: ZoneService,
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sdk: SDKService,
    private modalService: SisModalService,
    private features: FeaturesService,
  ) {}

  ngOnInit(): void {
    const account$ = this.sdk.currentAccount.pipe(take(1));
    const zones$ = this.zoneService.getZones().pipe(take(1));
    forkJoin([account$, zones$])
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap(([account, zones]) => {
          this.account = account;
          this.maxKnowledgeBoxes = account.max_kbs;
          this.zones = zones;
          this.sdk.nuclia.options.zone = zones.find((zone) => zone.id === account.zone)?.slug;
          return this.sdk.kbList;
        }),
      )
      .subscribe((kbs) => {
        this.knowledgeBoxes = kbs;
        this.cdr?.markForCheck();
      });
    // TODO: if no kbs, we should display to the default Empty page
  }

  manageKb(kb: IKnowledgeBoxItem): void {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbManageUrl(this.account?.slug || '', kb.slug || '')]);
  }

  manageKbUsers(kb: IKnowledgeBoxItem): void {
    this.sdk.nuclia.options.zone = kb.zone;
    if (kb.role_on_kb) {
      this.router.navigate([this.navigation.getKbUsersUrl(this.account!.slug, kb.slug!)]);
    } else {
      this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
        const data = { kb: new WritableKnowledgeBox(this.sdk.nuclia, account.id, kb) };
        this.modalService.openModal(UsersDialogComponent, { dismissable: true, data });
      });
    }
  }

  goToKb(kb: IKnowledgeBoxItem) {
    this.sdk.nuclia.options.zone = kb.zone;
    this.router.navigate([this.navigation.getKbUrl(this.account?.slug || '', kb.slug || '')]);
  }

  addKb(zones: Zone[], account: Account) {
    const data: KbAddData = {
      zones,
      account,
    };
    this.modalService
      .openModal(KbAddModalComponent, { dismissable: true, data })
      .onClose.pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => {
          if (result?.success === false) {
            this.toaster.error('stash.create.failure');
          }
          return !!result?.success;
        }),
      )
      .subscribe(() => {
        this.cdr?.markForCheck();
        this.sdk.refreshKbList();
      });
  }

  publishKb(kb: IKnowledgeBoxItem) {
    this.changeState(kb, 'publish', 'PUBLISHED');
  }

  retireKb(kb: IKnowledgeBoxItem) {
    this.changeState(kb, 'retire', 'PRIVATE');
  }

  private changeState(kb: IKnowledgeBoxItem, actionLabel: string, state: KBStates): void {
    this.translate
      .get(`stash.${actionLabel}.warning`, { kb: kb.title })
      .pipe(
        switchMap(
          (message) =>
            this.modalService.openConfirm({
              title: `stash.${actionLabel}.title`,
              description: message,
            }).onClose,
        ),
        filter((confirm) => !!confirm),
        switchMap(() => {
          this.setLoading(true);
          this.sdk.nuclia.options.zone = kb.zone;
          return new WritableKnowledgeBox(this.sdk.nuclia, this.account!.slug, kb).modify({ state });
        }),
        tap(() => this.sdk.refreshKbList()),
        takeUntil(this.unsubscribeAll),
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
    this.translate
      .get('stash.delete.warning', { kb: kb.title })
      .pipe(
        switchMap(
          (message) =>
            this.modalService.openConfirm({
              title: 'stash.delete.delete',
              description: message,
              isDestructive: true,
            }).onClose,
        ),
        filter((confirm) => !!confirm),
        switchMap(() => {
          this.setLoading(true);
          this.sdk.nuclia.options.zone = kb.zone;
          return new WritableKnowledgeBox(this.sdk.nuclia, this.account!.slug, kb).delete();
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe({
        next: () => {
          this.setLoading(false);
          this.sdk.refreshKbList();
        },
        error: () => {
          this.setLoading(false);
          this.toaster.error('stash.delete.error');
        },
      });
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
