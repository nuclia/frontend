import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BackendConfigurationService, FeaturesService } from '@flaps/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  matAccountCircleRound,
  matArrowBackRound,
  matInventory2Round,
  matSmartToyRound,
} from '@ng-icons/material-icons/round';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { filter, map, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../manager.store';
import { AccountService } from '../account.service';

@Component({
  templateUrl: './account-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, NgIcon, RouterLink, RouterLinkActive, RouterOutlet, AsyncPipe, DatePipe],
  providers: [provideIcons({ matAccountCircleRound, matArrowBackRound, matInventory2Round, matSmartToyRound })],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
  protected readonly navLink =
    'text-foreground hover:bg-foreground/8 block px-4 py-2 text-sm no-underline transition-colors';
  protected readonly navLinkChild =
    'text-foreground hover:bg-foreground/8 flex items-center gap-2 py-2 pr-4 pl-8 text-sm no-underline transition-colors';
  protected readonly navLinkActive = 'bg-foreground/8 font-semibold';

  private unsubscribeAll = new Subject<void>();

  canSeeUsers = this.store.canSeeUsers;
  canAccessKBs = this.store.canAccessKBs;
  canAccessProjects = this.store.canAccessProjects;
  account = this.store.accountDetails;
  knowledgeBoxList = this.store.kbList.pipe(map((kbs) => kbs.filter((kb) => kb.kbMode === 'kb')));
  agentList = this.store.kbList.pipe(map((kbs) => kbs.filter((kb) => kb.kbMode !== 'kb')));
  projectList = this.store.projectList;
  currentState = this.store.currentState;
  noStripe = this.backendConfig.noStripe();
  isTrial = this.features.isTrial;

  constructor(
    private route: ActivatedRoute,
    private accountService: AccountService,
    private store: ManagerStore,
    private backendConfig: BackendConfigurationService,
    private features: FeaturesService,
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['accountId']),
        switchMap((params) => this.accountService.loadAccountDetails(params['accountId'])),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  resetAccount() {
    this.store.setAccountDetails(null);
  }
}
