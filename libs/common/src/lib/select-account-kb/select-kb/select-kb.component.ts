import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { filter, forkJoin, Observable, of, shareReplay, Subject, switchMap, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { FeaturesService, NavigationService, SDKService, ZoneService } from '@flaps/core';
import { SelectAccountKbService } from '../select-account-kb.service';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectKbComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  standalone = this.selectService.standalone;

  kbs: Observable<IKnowledgeBoxItem[] | null> = this.sdk.kbList.pipe(shareReplay());
  hasSeveralAccounts: Observable<boolean> = this.selectService.accounts.pipe(
    map((accounts) => !!accounts && accounts.length > 1),
  );

  account = this.sdk.currentAccount;
  canManage = this.features.isAccountManager;
  canAddKb = this.standalone
    ? of(true)
    : this.account.pipe(
        map(
          (account) =>
            account.can_manage_account && (account.max_kbs > (account.current_kbs || 0) || account.max_kbs === -1),
        ),
      );

  constructor(
    private navigation: NavigationService,
    private selectService: SelectAccountKbService,
    private router: Router,
    private sdk: SDKService,
    private toast: SisToastService,
    private modalService: SisModalService,
    private zoneService: ZoneService,
    private features: FeaturesService,
  ) {}

  createKb() {
    this.account
      .pipe(
        take(1),
        switchMap((account) => this.router.navigate([this.navigation.getKbCreationUrl(account.slug)])),
      )
      .subscribe();
    // const zones$ = this.standalone ? of([]) : this.zoneService.getZones();
    // forkJoin([this.account.pipe(take(1)), zones$])
    //   .pipe(
    //     switchMap(([account, zones]) => {
    //       if (!this.sdk.nuclia.options.zone) {
    //         // zone must be set to get configuration schema
    //         this.sdk.nuclia.options.zone = zones[0]?.slug;
    //       }
    //       return this.modalService.openModal(KbAddModalComponent, { dismissable: true, data: { account, zones } })
    //         .onClose;
    //     }),
    //     filter((result) => {
    //       if (result?.success === false) {
    //         this.toast.error('error.creating-kb');
    //       }
    //       return !!result?.success;
    //     }),
    //   )
    //   .subscribe((result) => {
    //     this.sdk.refreshKbList();
    //     if (!this.standalone) {
    //       this.sdk.nuclia.options.zone = result.zone;
    //       this.router.navigate([this.navigation.getKbUrl(result.accountSlug, result.kbSlug)]);
    //     } else {
    //       this.router.navigate([this.navigation.getKbUrl(result.accountSlug, result.kbId)]);
    //     }
    //   });
  }

  goToAccountManage() {
    this.account
      .pipe(take(1))
      .subscribe((account) => this.router.navigate([this.navigation.getAccountManageUrl(account.slug)]));
  }

  goToKb(kb: IKnowledgeBoxItem) {
    if (kb.slug && kb.role_on_kb) {
      const kbSlug = kb.slug;
      this.sdk.nuclia.options.knowledgeBox = kb.id;

      if (!this.standalone) {
        this.sdk.nuclia.options.zone = kb.zone;
        forkJoin([this.sdk.nuclia.rest.getZones(), this.account.pipe(take(1))]).subscribe(([zones, account]) =>
          this.router.navigate([this.navigation.getKbUrl(account.slug, kbSlug)]),
        );
      } else {
        this.account
          .pipe(take(1))
          .subscribe((account) => this.router.navigate([this.navigation.getKbUrl(account.slug, kbSlug)]));
      }
    }
  }

  deleteKb(event: MouseEvent, kbId: string, zone: string, title?: string) {
    event.stopPropagation();
    this.modalService
      .openConfirm({
        title: 'stash.delete.delete',
        description: `${title || ''} (${kbId})`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((yes) => !!yes),
        switchMap(() => this.account),
        switchMap((account) => this.sdk.nuclia.db.getKnowledgeBox(account.id, kbId, zone)),
        switchMap((kb) => kb.delete()),
      )
      .subscribe(() => this.sdk.refreshKbList());
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
