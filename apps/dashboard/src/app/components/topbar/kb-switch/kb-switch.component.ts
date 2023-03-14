import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, filter, map, Observable, switchMap, tap } from 'rxjs';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';
import { stfAnimations } from '@flaps/pastanaga';
import { NavigationService } from '@flaps/common';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: stfAnimations,
})
export class KbSwitchComponent {
  @Output() close = new EventEmitter<void>();

  kb = this.sdk.currentKb;
  account?: Account;

  knowledgeBoxes = this.stateService.account.pipe(
    filter((account) => !!account),
    tap((account) => {
      this.account = account || undefined;
    }),
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account!.slug)),
  );
  showDemo = this.tracking.isFeatureEnabled('show-demo-kb');

  showKbSelector: Observable<boolean> = combineLatest([this.knowledgeBoxes, this.showDemo]).pipe(
    map(([kbs, demo]) => kbs.length > 1 || demo),
  );

  constructor(
    private sdk: SDKService,
    private router: Router,
    private navigation: NavigationService,
    private stateService: StateService,
    private tracking: STFTrackingService,
  ) {}

  goToKb(kb: IKnowledgeBoxItem) {
    this.router.navigate([this.navigation.getKbUrl(this.account!.slug, kb.slug!)]);
    this.close.emit();
  }
  goToDemo() {
    this.router.navigate([this.navigation.getKbUrl(this.account!.slug, this.sdk.DEMO_SLUG)]);
    this.close.emit();
  }
}
