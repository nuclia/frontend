import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeaturesService, SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';
import { of, Subject } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BadgeComponent, SisProgressModule, InfoCardComponent } from '@nuclia/sistema';
import { filter, switchMap, take } from 'rxjs/operators';
import {
  ModalService,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { CreateRaComponent } from '../create-ra/create-ra.component';

@Component({
  selector: 'app-ra-list',
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
  templateUrl: './ra-list.component.html',
  styleUrl: './ra-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaListComponent implements OnInit, OnDestroy {
  isLoading = false;
  account?: Account;
  retrievalAgents: IKnowledgeBoxItem[] | undefined;
  maxRetrievalAgents: number = 1;
  canAddRa = this.features.isAccountManager;
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
      .subscribe((ras) => {
        this.retrievalAgents = ras;
        this.cdr?.markForCheck();
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  createRa() {
    this.modalService
      .openModal(CreateRaComponent)
      .onClose.pipe(filter((data) => !!data))
      .subscribe((data) => {
        // TODO
        console.log('Create agent', data);
      });
  }

  deleteRa(ra: IKnowledgeBoxItem) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('account.retrieval-agents.confirm-deletion', { name: ra.title }),
        isDestructive: true,
      })
      .onClose.pipe(filter((confirmed) => !!confirmed))
      .subscribe(() => {
        // TODO
        console.log('Delete agent', ra.title);
      });
  }
}
