import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService, STFUtils } from '@flaps/core';
import {
  ModalService,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Account, IRetrievalAgentItem, RetrievalAgent, RetrievalAgentCreation } from '@nuclia/core';
import {
  BadgeComponent,
  InfoCardComponent,
  SisProgressModule,
  SisToastService,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { Subject, throwError } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';
import { CreateAragComponent } from '../create-arag/create-arag.component';

@Component({
  selector: 'app-arag-list',
  imports: [
    CommonModule,
    SisProgressModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    TranslateModule,
    PaTooltipModule,
    BadgeComponent,
    StickyFooterComponent,
    InfoCardComponent,
  ],
  templateUrl: './arag-list.component.html',
  styleUrl: './arag-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AragListComponent implements OnInit, OnDestroy {
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);
  private sdk = inject(SDKService);
  private features = inject(FeaturesService);
  private modalService = inject(ModalService);
  private translate = inject(TranslateService);
  private navigation = inject(NavigationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  unsubscribeAll = new Subject<void>();
  isLoading = false;
  account?: Account;
  retrievalAgents: IRetrievalAgentItem[] | undefined;
  maxRetrievalAgents: number = 1;
  canAddArag = this.features.isAccountManager;
  aragUrl?: string;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => params['create']),
      )
      .subscribe(() => {
        this.createArag();
        this.router.navigate(['./'], { relativeTo: this.route, queryParams: {} });
      });

    this.sdk.currentAccount
      .pipe(take(1))
      .pipe(
        switchMap((account) => {
          this.account = account;
          // TODO: replace by max_arags once implemented in the backend
          this.maxRetrievalAgents = account.max_kbs;
          return this.sdk.aragList;
        }),
      )
      .subscribe((arags) => {
        this.retrievalAgents = arags;
        this.cdr?.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goToArag(arag: IRetrievalAgentItem) {
    if (!this.account) {
      return;
    }
    this.sdk.nuclia.options.zone = arag.zone;
    const route = this.navigation.getRetrievalAgentUrl(this.account.slug, arag.slug);
    this.router.navigate([route]);
  }

  goToSessions(arag: IRetrievalAgentItem) {
    if (!this.account) {
      return;
    }
    this.sdk.nuclia.options.zone = arag.zone;
    const route = this.navigation.getAragSessionsUrl(this.account.slug, arag.slug);
    this.router.navigate([route]);
  }

  goToSettings(arag: IRetrievalAgentItem) {
    if (!this.account) {
      return;
    }
    this.sdk.nuclia.options.zone = arag.zone;
    const route = this.navigation.getAragSettingsUrl(this.account.slug, arag.slug);
    this.router.navigate([route]);
  }

  createArag() {
    this.modalService
      .openModal(CreateAragComponent)
      .onClose.pipe(
        filter((data) => !!data),
        map((data) => {
          this.setLoading(true);
          const arag: RetrievalAgentCreation = {
            title: data.name,
            slug: STFUtils.generateSlug(data.name),
            mode: 'agent',
          };
          return { arag, zone: data.zone };
        }),
        switchMap(({ arag, zone }) =>
          this.sdk.currentAccount.pipe(
            take(1),
            switchMap((account) =>
              this.sdk.nuclia.db.createRetrievalAgent(account.id, arag, zone).pipe(
                catchError((error) => {
                  if (error.status === 409) {
                    arag.slug = `${arag.slug}-${STFUtils.generateRandomSlugSuffix()}`;
                    return this.sdk.nuclia.db.createRetrievalAgent(account.id, arag, zone);
                  } else {
                    return throwError(() => error);
                  }
                }),
              ),
            ),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.sdk.refreshAragList();
          this.setLoading(false);
        },
        error: (error) => {
          const message =
            error.status === 402
              ? 'account.retrieval-agents.error.creation-limit'
              : 'account.retrieval-agents.error.create';
          this.toaster.error(message);
          this.setLoading(false);
        },
      });
  }

  deleteArag(arag: IRetrievalAgentItem) {
    if (!this.account) {
      return;
    }
    const account = this.account;
    this.modalService
      .openConfirm({
        title: this.translate.instant('account.retrieval-agents.confirm-deletion', { name: arag.title }),
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => {
          this.setLoading(true);
          this.sdk.nuclia.options.zone = arag.zone;
          return new RetrievalAgent(this.sdk.nuclia, account.slug, arag).delete();
        }),
      )
      .subscribe({
        next: () => {
          this.sdk.refreshAragList();
          this.setLoading(false);
        },
        error: () => {
          this.toaster.error('account.retrieval-agents.error.delete');
          this.setLoading(false);
        },
      });
  }

  private setLoading(isLoading: boolean): void {
    this.isLoading = isLoading;
    this.cdr.markForCheck();
  }
}
