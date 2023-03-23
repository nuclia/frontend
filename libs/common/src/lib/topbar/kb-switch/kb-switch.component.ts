import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, distinctUntilChanged, filter, map, Observable, share, switchMap, tap } from 'rxjs';
import { SDKService, StateService, STFTrackingService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';
import { stfAnimations } from '@flaps/pastanaga';
import { NavigationService } from '../../services';

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

  knowledgeBoxes: Observable<IKnowledgeBoxItem[]> = this.sdk.nuclia.options.standalone
    ? this.sdk.nuclia.db
        .getStandaloneKbs()
        .pipe(map((kbs) => kbs.map((kb) => ({ ...kb, id: kb.uuid, title: kb.slug, zone: 'local' }))))
    : this.stateService.account.pipe(
        filter((account) => !!account),
        map((account) => account as Account),
        distinctUntilChanged(),
        tap((account) => (this.account = account)),
        switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account.slug)),
        share(),
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
