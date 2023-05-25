import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, map, Observable, take } from 'rxjs';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';
import { NavigationService } from '../../services';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbSwitchComponent {
  @Output() close = new EventEmitter<void>();

  kb = this.sdk.currentKb;
  account: Observable<Account> = this.sdk.currentAccount;

  standalone: boolean = this.sdk.nuclia.options.standalone || false;
  knowledgeBoxes: Observable<IKnowledgeBoxItem[]> = this.sdk.kbList;
  showDemo = this.tracking
    .isFeatureEnabled('show-demo-kb')
    .pipe(map((isDemoFeatureEnabled) => isDemoFeatureEnabled && !this.standalone));

  showKbSelector: Observable<boolean> = combineLatest([this.knowledgeBoxes, this.showDemo]).pipe(
    map(([kbs, demo]) => kbs.length > 1 || demo || this.standalone),
  );

  constructor(
    private sdk: SDKService,
    private router: Router,
    private navigation: NavigationService,
    private tracking: STFTrackingService,
  ) {}

  goToKb(kb: IKnowledgeBoxItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.router.navigate([this.navigation.getKbUrl(account.slug, this.standalone ? kb.id : kb.slug || kb.id)]);
      this.close.emit();
    });
  }
  goToDemo() {
    this.account.pipe(take(1)).subscribe((account) => {
      this.router.navigate([this.navigation.getKbUrl(account.slug, this.sdk.DEMO_SLUG)]);
      this.close.emit();
    });
  }
}
