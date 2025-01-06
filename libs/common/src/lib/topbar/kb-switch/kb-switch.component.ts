import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, take } from 'rxjs';
import { NavigationService, SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem } from '@nuclia/core';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KbSwitchComponent {
  @Output() close = new EventEmitter<void>();

  kb = this.sdk.currentKb;
  account: Observable<Account> = this.sdk.currentAccount;

  standalone: boolean = this.sdk.nuclia.options.standalone || false;
  knowledgeBoxes: Observable<IKnowledgeBoxItem[]> = this.sdk.kbList;
  showKbSelector: Observable<boolean> = this.knowledgeBoxes.pipe(map((kbs) => kbs.length > 1 || this.standalone));

  constructor(
    private sdk: SDKService,
    private router: Router,
    private navigation: NavigationService,
  ) {}

  goToKb(kb: IKnowledgeBoxItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = kb.zone;
      this.router.navigate([this.navigation.getKbUrl(account.slug, this.standalone ? kb.id : kb.slug || kb.id)]);
      this.close.emit();
    });
  }
}
