import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import { filter, switchMap } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountService } from '../account.service';

@Component({
  templateUrl: './account-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, NgIcon, RouterLink, RouterLinkActive, RouterOutlet, DatePipe],
  providers: [provideIcons({ matAccountCircleRound, matArrowBackRound, matInventory2Round, matSmartToyRound })],
})
export class AccountDetailsComponent {
  private route = inject(ActivatedRoute);
  private accountService = inject(AccountService);
  private store = inject(ManagerStore);
  private backendConfig = inject(BackendConfigurationService);
  private features = inject(FeaturesService);

  protected readonly navLink =
    'text-foreground hover:bg-foreground/8 block px-4 py-2 text-sm no-underline transition-colors';
  protected readonly navLinkChild =
    'text-foreground hover:bg-foreground/8 flex items-center gap-2 py-2 pr-4 pl-8 text-sm no-underline transition-colors';
  protected readonly navLinkActive = 'bg-foreground/8 font-semibold';

  canSeeUsers = this.store.canSeeUsers;
  canAccessKBs = this.store.canAccessKBs;
  canAccessProjects = this.store.canAccessProjects;
  account = this.store.accountDetails;
  knowledgeBoxList = computed(() => this.store.kbList().filter((kb) => kb.kbMode === 'kb'));
  agentList = computed(() => this.store.kbList().filter((kb) => kb.kbMode !== 'kb'));
  projectList = this.store.projectList;
  currentState = this.store.currentState;
  noStripe = this.backendConfig.noStripe();
  isTrial = toSignal(this.features.isTrial);

  constructor() {
    this.route.params
      .pipe(
        filter((params) => !!params['accountId']),
        switchMap((params) => this.accountService.loadAccountDetails(params['accountId'])),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  resetAccount() {
    this.store.setAccountDetails(null);
  }
}
