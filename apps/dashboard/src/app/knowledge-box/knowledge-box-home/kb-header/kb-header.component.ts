import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaDropdownModule, PaPopupModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Counters } from '@nuclia/core';
import { NavigationService, SDKService, STFPipesModule } from '@flaps/core';
import { AppService } from '@flaps/common';
import { SisModalService } from '@nuclia/sistema';
import { combineLatest, map } from 'rxjs';
import { DeveloperIntegrationsModalComponent } from '../developer-integrations-modal/developer-integrations-modal.component';
import { TestPageModalComponent } from '../test-page-modal/test-page-modal.component';

/**
 * KB header shown once onboarding is completed: KB name, storage summary and primary actions.
 * Self-contained: derives all its data from the current KB, so it takes no inputs.
 */
@Component({
  selector: 'app-kb-header',
  imports: [
    CommonModule,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTooltipModule,
    RouterModule,
    STFPipesModule,
    TranslateModule,
  ],
  templateUrl: './kb-header.component.html',
  styleUrl: './kb-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KbHeaderComponent {
  private sdk = inject(SDKService);
  private appService = inject(AppService);
  private navigationService = inject(NavigationService);
  private modalService = inject(SisModalService);

  private currentKb = this.sdk.currentKb;

  kbName = toSignal(this.currentKb.pipe(map((kb) => kb.title)), { initialValue: '' });
  externalIndexProvider = toSignal(this.currentKb.pipe(map((kb) => kb.external_index_provider || null)), {
    initialValue: null as string | null,
  });
  storageSummary = toSignal(this.sdk.counters.pipe(map((counters) => counters ?? null)), {
    initialValue: null as Counters | null,
  });
  locale = toSignal(this.appService.currentLocale, { initialValue: 'en' });
  kbUrl = toSignal(
    combineLatest([this.sdk.currentAccount, this.currentKb]).pipe(
      map(([account, kb]) => {
        const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
        return this.navigationService.getKbUrl(account.slug, kbSlug);
      }),
    ),
    { initialValue: '' },
  );

  openDeveloperIntegrations(): void {
    this.modalService.openModal(DeveloperIntegrationsModalComponent);
  }

  openTestPage(): void {
    this.modalService.openModal(TestPageModalComponent);
  }
}
