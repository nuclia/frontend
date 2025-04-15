import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FeaturesService, SDKService } from '@flaps/core';
import {
  ModalService,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Account, IKnowledgeBoxItem, IRetrievalAgentItem } from '@nuclia/core';
import { BadgeComponent, InfoCardComponent, SisProgressModule } from '@nuclia/sistema';
import { of, Subject } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
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
    InfoCardComponent,
  ],
  templateUrl: './arag-list.component.html',
  styleUrl: './arag-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AragListComponent implements OnInit, OnDestroy {
  isLoading = false;
  account?: Account;
  retrievalAgents: IKnowledgeBoxItem[] | undefined;
  maxRetrievalAgents: number = 1;
  canAddArag = this.features.isAccountManager;
  unsubscribeAll = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private features: FeaturesService,
    private modalService: ModalService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.sdk.currentAccount
      .pipe(take(1))
      .pipe(
        switchMap((account) => {
          this.account = account;
          this.maxRetrievalAgents = account.max_kbs;
          return of([]); //TODO this.sdk.kbList;
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

  createArag() {
    this.modalService
      .openModal(CreateAragComponent)
      .onClose.pipe(filter((data) => !!data))
      .subscribe((data) => {
        // TODO
        console.log('Create agent', data);
      });
  }

  deleteArag(arag: IRetrievalAgentItem) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('account.retrieval-agents.confirm-deletion', { name: arag.title }),
        isDestructive: true,
      })
      .onClose.pipe(filter((confirmed) => !!confirmed))
      .subscribe(() => {
        // TODO
        console.log('Delete agent', arag.title);
      });
  }
}
