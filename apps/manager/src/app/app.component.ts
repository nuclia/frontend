import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Toaster } from '@flaps/pastanaga';
import { STFUtils } from '@flaps/core';
import { SDKService, BackendConfigurationService, UserService } from '@flaps/core';
import { filter, Subject } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: false }) toastsContainer:
    | ViewContainerRef
    | undefined;

  title = 'webapp';
  version: string | undefined;

  private unsubscribeAll: Subject<void>;

  constructor(
    private router: Router,
    private toaster: Toaster,
    private user: UserService,
    private translate: TranslateService,
    private config: BackendConfigurationService,
    private sdk: SDKService,
  ) {
    this.unsubscribeAll = new Subject();
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(filter((yes) => yes))
      .subscribe(() => {
        this.router.navigate(['/']);
      });
    this.initTranslate(undefined);
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.router.navigate(['/user/login']);
    });
    this.user.userPrefs.subscribe((userPrefs) => {
      this.initTranslate(userPrefs?.language?.toLowerCase());
    });
  }

  ngOnInit() {
    // Configure toasters container.
    if (this.toastsContainer) {
      this.toaster.registerContainer(this.toastsContainer);
    }

    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  initTranslate(userLocale: string | undefined) {
    this.translate.setDefaultLang('en');
    const browserLang = this.translate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.translate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.translate.use(browserLang);
    } else {
      this.translate.use('en');
    }
  }
}
