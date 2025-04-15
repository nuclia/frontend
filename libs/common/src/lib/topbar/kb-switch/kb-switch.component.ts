import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { Router } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { Account, IKnowledgeBoxItem, IRetrievalAgentItem } from '@nuclia/core';
import { combineLatest, map, Observable, Subject, take } from 'rxjs';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KbSwitchComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();

  @Output() close = new EventEmitter<void>();

  kb$ = this.sdk.currentKb;
  account: Observable<Account> = this.sdk.currentAccount;

  standalone: boolean = this.sdk.nuclia.options.standalone || false;
  knowledgeBoxes: Observable<IKnowledgeBoxItem[]> = this.sdk.kbList;
  arags: Observable<IRetrievalAgentItem[]> = this.sdk.aragList;
  showKbSelector: Observable<boolean> = combineLatest([this.knowledgeBoxes, this.arags]).pipe(
    map(([kbs, arags]) => kbs.length > 1 || arags.length > 1 || this.standalone),
  );

  constructor(
    private sdk: SDKService,
    private router: Router,
    private navigation: NavigationService,
  ) {}

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goToKb(kb: IKnowledgeBoxItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = kb.zone;
      this.router.navigate([this.navigation.getKbUrl(account.slug, this.standalone ? kb.id : kb.slug || kb.id)]);
      this.close.emit();
    });
  }
  goToArag(arag: IRetrievalAgentItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = arag.zone;
      this.router.navigate([this.navigation.getRetrievalAgentUrl(account.slug, arag.slug)]);
      this.close.emit();
    });
  }
}
