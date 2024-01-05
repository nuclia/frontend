import { AfterViewInit, Component, Inject, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import {
  BackendConfigurationService,
  SDKService,
  STFSplashScreenService,
  STFTrackingService,
  STFUtils,
  UserService,
} from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subject, take } from 'rxjs';
import { ModalConfig, TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { takeUntil } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesModalComponent, MessageModalComponent } from '@flaps/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
    private tracking: STFTrackingService,
    private config: BackendConfigurationService,
    private sdk: SDKService,
    private modalService: SisModalService,
    private paTranslate: PaTranslateService,
    @Inject(DOCUMENT) private document: any,
  ) {
    this.unsubscribeAll = new Subject();

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.tracking.navigation(event as NavigationEnd));

    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.tracking.logout();
      this.router.navigate(['/user/login']);
      this.sdk.cleanAccount();
    });

    if (this.config.useRemoteLogin()) {
      this.remoteLogin();
    }
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
    this.displayAlert();
    this.displayAnnounce();
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

  private displayAlert() {
    this.checkMessages(true);
  }

  private displayAnnounce() {
    this.checkMessages(false);
  }

  private checkMessages(alert: boolean) {
    this.tracking
      .getStatusMessage(alert)
      .pipe(
        take(1),
        filter((message) => !!message),
      )
      .subscribe((message) => {
        this.modalService.openModal(
          MessageModalComponent,
          new ModalConfig<{ title: string; message: string }>({
            data: {
              title: alert ? 'generic.alert' : 'generic.announce',
              message,
            },
          }),
        );
      });
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
      'ArrowLeft',
      'ArrowRight',
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
