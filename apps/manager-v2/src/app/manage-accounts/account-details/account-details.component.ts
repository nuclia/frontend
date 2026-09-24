import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BackendConfigurationService, FeaturesService } from '@flaps/core';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { filter, map, Subject, switchMap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ManagerStore } from '../../manager.store';
import { AccountService } from '../account.service';

@Component({
  templateUrl: './account-details.component.html',
  styleUrls: ['./account-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaButtonModule, RouterLink, RouterLinkActive, PaIconModule, RouterOutlet, AsyncPipe, DatePipe],
})
export class AccountDetailsComponent implements OnInit, OnDestroy {
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
