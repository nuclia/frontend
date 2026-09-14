import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BackendConfigurationService, SDKService, STFSplashScreenService, STFUtils, UserService } from '@flaps/core';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;

  private destroyRef = inject(DestroyRef);

  version: string | undefined;

  constructor(
    private user: UserService,
    // Injected only to force instantiation (providedIn: 'root' services are lazy) — the service
    // hides the splash screen itself once routing settles and the app becomes stable.
    private splashScreenService: STFSplashScreenService,
    private config: BackendConfigurationService,
    private paTranslate: PaTranslateService,
    private ngxTranslate: TranslateService,
    private sdk: SDKService,
  ) {
    this.initTranslate();
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.sdk.cleanAccount();
      this.sdk.nuclia.auth.redirectToOAuth();
    });
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
    this.preventDragAndDropOnWindow();
  }

  ngOnDestroy(): void {
    this.cleanUpEventListener();
  }

  initTranslate(userLocale?: string) {
    this.ngxTranslate.setDefaultLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().includes(browserLang)) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => this.paTranslate.initTranslationsAndUse(event.lang, event.translations));
  }

  private preventDefault(e: DragEvent) {
    e.preventDefault();
  }

  private preventDragAndDropOnWindow() {
    window.addEventListener('dragover', this.preventDefault, false);
    window.addEventListener('drop', this.preventDefault, false);
  }

  private cleanUpEventListener() {
    window.removeEventListener('dragover', this.preventDefault);
    window.removeEventListener('drop', this.preventDefault);
  }
}
