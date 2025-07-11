import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild, ViewContainerRef, DOCUMENT } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';
import {
  BackendConfigurationService,
  LabelsService,
  SDKService,
  STFSplashScreenService,
  STFUtils,
  UserService,
} from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject } from 'rxjs';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { takeUntil } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesModalComponent } from '@flaps/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;

  private unsubscribeAll: Subject<void>;

  version: string | undefined;

  constructor(
    private router: Router,
    private user: UserService,
    private splashScreenService: STFSplashScreenService,
    private ngxTranslate: TranslateService,
    private config: BackendConfigurationService,
    private sdk: SDKService,
    private modalService: SisModalService,
    private labelService: LabelsService,
    private paTranslate: PaTranslateService,
    @Inject(DOCUMENT) private document: any,
  ) {
    this.unsubscribeAll = new Subject();

    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.router.navigate(['/user/login']);
      this.sdk.cleanAccount();
    });

    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
    this.labelService.initLabelSets();
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
    this.preventDragAndDropOnWindow();
    this.listenFeatureFlagCode();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.cleanUpEventListener();
  }

  ngAfterViewInit() {
    this.splashScreenService.hide();
  }

  initTranslate(userLocale?: string) {
    this.ngxTranslate.setDefaultLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange
      .pipe(takeUntil(this.unsubscribeAll))
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

  private remoteLogin() {
    const params = location.search;
    if (params.includes('access_token')) {
      const querystring = new URLSearchParams(params.split('?')[1]);
      const access_token = querystring.get('access_token');
      if (access_token) {
        this.sdk.nuclia.auth.authenticate({
          access_token,
          refresh_token: querystring.get('refresh_token') || '',
        });
      }
    }
  }

  listenFeatureFlagCode() {
    const activationKeyCodes = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'KeyB',
      'KeyA',
    ];
    let userKeys: string[] = [];
    this.document.addEventListener('keyup', (event: KeyboardEvent) => {
      if ((event.target as HTMLElement).tagName === 'INPUT') return;
      userKeys = [...userKeys, event.code].slice(-activationKeyCodes.length);
      if (JSON.stringify(activationKeyCodes) === JSON.stringify(userKeys)) {
        this.modalService.openModal(FeaturesModalComponent);
      }
    });
  }
}
