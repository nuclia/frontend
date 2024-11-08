import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem, WritableKnowledgeBox } from '@nuclia/core';
import { Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
import { SisModalService, SisProgressModule, SisToastService, StickyFooterComponent } from '@nuclia/sistema';
import { filter, switchMap, take, takeUntil } from 'rxjs/operators';
import { UsersDialogComponent } from '../users-dialog/users-dialog.component';
import { PaButtonModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-kb-list',
  standalone: true,
  imports: [
    CommonModule,
    SisProgressModule,
    PaButtonModule,
    TranslateModule,
    PaTooltipModule,
    RouterLink,
    StickyFooterComponent,
  ],
  templateUrl: './kb-list.component.html',
  styleUrl: './kb-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbListComponent implements OnInit, OnDestroy {
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
    private cdr: ChangeDetectorRef,
    private toaster: SisToastService,
    private sdk: SDKService,
    private modalService: SisModalService,
    private features: FeaturesService,
  ) {}

  ngOnInit(): void {
    this.sdk.currentAccount
      .pipe(take(1))
      .pipe(
        switchMap((account) => {
          this.account = account;
          this.maxKnowledgeBoxes = account.max_kbs;
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
