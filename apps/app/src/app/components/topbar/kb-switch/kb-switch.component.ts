import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { filter, switchMap, tap } from 'rxjs';
import { StateService, SDKService } from '@flaps/auth';
import { IKnowledgeBox, Account } from '@nuclia/core';
import { stfAnimations } from '@flaps/pastanaga';
import { NavigationService } from '../../../services/navigation.service';

@Component({
  selector: 'app-kb-switch',
  templateUrl: './kb-switch.component.html',
  styleUrls: ['./kb-switch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: stfAnimations,
})
export class KbSwitchComponent {
  @Output() close = new EventEmitter<void>();
  account?: Account;

  knowledgeBoxes = this.stateService.account.pipe(
    filter((account) => !!account),
    tap((account) => {
      this.account = account || undefined;
    }),
    switchMap((account) => this.sdk.nuclia.db.getKnowledgeBoxes(account!.slug)),
  );

  constructor(
    private sdk: SDKService,
    private router: Router,
    private navigation: NavigationService,
    private stateService: StateService,
  ) {}

  goToKb(kb: IKnowledgeBox) {
    this.router.navigate([this.navigation.getKbUrl(this.account!.slug, kb.slug!)]);
    this.close.emit();
  }
}
