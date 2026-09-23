import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationService, SDKService } from '@flaps/core';
import { PaDropdownModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { Account, IKnowledgeBoxItem, IRetrievalAgentItem } from '@nuclia/core';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { combineLatest, map, Observable, of, Subject, take } from 'rxjs';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DropdownButtonComponent,
    PaDropdownModule,
    PaTooltipModule,
    PaIconModule,
    AsyncPipe,
    TranslatePipe,
    TranslateModule,
  ],
})
export class KbSwitchComponent implements OnDestroy {
  private readonly unsubscribeAll = new Subject<void>();

  @Output() switchClose = new EventEmitter<void>();

  readonly kb$ = this.sdk.currentKb;
  readonly account: Observable<Account> = this.sdk.currentAccount;
  readonly isCowork = this.account.pipe(map((account) => account.workflow === 'cowork'));

  readonly standalone: boolean = this.sdk.nuclia.options.standalone || false;
  readonly knowledgeBoxes: Observable<IKnowledgeBoxItem[]> = this.sdk.kbList;
  readonly arags: Observable<IRetrievalAgentItem[]> = this.sdk.aragList;
  readonly showKbSelector: Observable<boolean> = this.standalone
    ? of(true)
    : combineLatest([this.knowledgeBoxes, this.arags]).pipe(map(([kbs, arags]) => kbs.length + arags.length > 1));
  readonly inRaoApp = this.navigation.inRaoApp;

  constructor(
    private readonly sdk: SDKService,
    private readonly navigation: NavigationService,
  ) {}

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  goToKb(kb: IKnowledgeBoxItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = kb.zone;
      this.navigation.navigateExternal(
        this.navigation.getKbUrl(account.slug, this.standalone ? kb.id : kb.slug || kb.id),
      );
      this.switchClose.emit();
    });
  }
  goToArag(arag: IRetrievalAgentItem) {
    this.account.pipe(take(1)).subscribe((account) => {
      this.sdk.nuclia.options.zone = arag.zone;
      this.navigation.navigateExternal(this.navigation.getRetrievalAgentUrl(account.slug, arag.slug));
      this.switchClose.emit();
    });
  }
}
