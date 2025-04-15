import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { IKnowledgeBoxItem, IRetrievalAgentItem } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { filter, forkJoin, Observable, of, shareReplay, Subject, switchMap, take } from 'rxjs';
import { map } from 'rxjs/operators';
import { SelectAccountKbService } from '../select-account-kb.service';

@Component({
  selector: 'app-select-kb',
  templateUrl: './select-kb.component.html',
  styleUrls: ['./select-kb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SelectKbComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();
  standalone = this.selectService.standalone;

  kbs: Observable<IKnowledgeBoxItem[] | null> = this.sdk.kbList.pipe(shareReplay());
  arags: Observable<IRetrievalAgentItem[] | null> = this.sdk.aragList.pipe(shareReplay());
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

  isRetrievalAgentEnabled = this.features.unstable.retrievalAgents;

  constructor(
    private navigation: NavigationService,
    private selectService: SelectAccountKbService,
    private router: Router,
    private sdk: SDKService,
    private modalService: SisModalService,
    private features: FeaturesService,
  ) {}

  createKb() {
    this.account
      .pipe(
        take(1),
        switchMap((account) => this.router.navigate([this.navigation.getKbCreationUrl(account.slug)])),
      )
      .subscribe();
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

  goToArag(arag: IRetrievalAgentItem) {
    if (arag.slug && arag.role_on_kb) {
      const raSlug = arag.slug;
      this.sdk.nuclia.options.knowledgeBox = arag.id;

      if (!this.standalone) {
        this.sdk.nuclia.options.zone = arag.zone;
        forkJoin([this.sdk.nuclia.rest.getZones(), this.account.pipe(take(1))]).subscribe(([, account]) =>
          this.router.navigate([this.navigation.getRetrievalAgentUrl(account.slug, raSlug)]),
        );
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
