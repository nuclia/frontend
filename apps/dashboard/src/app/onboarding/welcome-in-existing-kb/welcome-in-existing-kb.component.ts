import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';
import { map, take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

@Component({
  imports: [CommonModule, PaModalModule, TranslateModule, PaButtonModule, PaIconModule],
  templateUrl: './welcome-in-existing-kb.component.html',
  styleUrl: './welcome-in-existing-kb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeInExistingKBComponent {
  isWriter = this.features.isKbAdminOrContrib;
  name = this.sdk.nuclia.auth.getJWTUser()?.ext.first_name || '';
  title = this.sdk.currentKb.pipe(map((kb) => kb.title));
  kbUrl = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.navigationService.getKbUrl(account.slug, kbSlug);
    }),
  );

  constructor(
    private modal: ModalRef,
    private features: FeaturesService,
    private router: Router,
    private route: ActivatedRoute,
    private sdk: SDKService,
    private navigationService: NavigationService,
  ) {}

  goTo(path: string) {
    this.kbUrl.pipe(take(1)).subscribe((url) => {
      this.router.navigate([url + path]);
      this.modal.close();
      localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
    });
  }
}
