import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';
import { Router, RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { switchMap, take } from 'rxjs/operators';
import { map } from 'rxjs';

@Component({
  imports: [
    CommonModule,
    PaModalModule,
    TranslateModule,
    PaModalModule,
    PaButtonModule,
    BadgeComponent,
    PaIconModule,
    RouterLink,
  ],
  templateUrl: './unauthorized-feature-modal.component.html',
  styleUrl: './unauthorized-feature-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedFeatureModalComponent {
  featureList = [
    { name: 'llm', icon: 'settings' },
    { name: 'prompt', icon: 'prompt' },
    { name: 'summarization', icon: 'summary' },
    { name: 'synonyms', icon: 'synonyms' },
    { name: 'task-automation', icon: 'submenu' },
    { name: 'activity-log', icon: 'activity-log' },
    { name: 'indexed-size', icon: 'database' },
  ];

  currentFeature: string;

  constructor(
    public modal: ModalRef<{ feature: string }>,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private router: Router,
  ) {
    this.currentFeature = modal.config.data?.['feature'] || '';
  }

  goToUpgrade() {
    this.modal.close();
    this.sdk.currentAccount
      .pipe(
        take(1),
        map((account) => this.navigationService.getUpgradeUrl(account.slug)),
        switchMap((upgradePath) => this.router.navigate([upgradePath])),
      )
      .subscribe();
  }
}
