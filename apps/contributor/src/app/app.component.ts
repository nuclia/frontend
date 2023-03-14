import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BackendConfigurationService, SDKService, STFTrackingService, STFUtils } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, filter, of, Subject, switchMap, take, tap } from 'rxjs';
import { ModalConfig, TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { MessageModalComponent, NavigationService } from '@flaps/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';

const userLocaleKey = 'NUCLIA_USER_LOCALE';

@Component({
  selector: 'nco-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;
  version?: string;

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(
    private config: BackendConfigurationService,
    private ngxTranslate: TranslateService,
    private paTranslate: PaTranslateService,
    private tracking: STFTrackingService,
    private modalService: SisModalService,
    private sdk: SDKService,
    private titleService: Title,
    private router: Router,
    private navigation: NavigationService,
  ) {
    this.updateStateOnRouteChange();
    const userLocale = localStorage.getItem(userLocaleKey);
    this.initTranslate(userLocale);
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
    this.displayAlert();
    this.displayAnnounce();
    this.preventDragAndDropOnWindow();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    this.cleanUpEventListener();
  }

  initTranslate(userLocale?: string | null) {
    this.ngxTranslate.setDefaultLang('en');
    const browserLang = this.ngxTranslate.getBrowserLang();

    if (userLocale && userLocale !== '') {
      this.ngxTranslate.use(userLocale);
    } else if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.ngxTranslate.use(browserLang);
    } else {
      this.ngxTranslate.use('en');
    }

    this.ngxTranslate.onLangChange.pipe(takeUntil(this.unsubscribeAll)).subscribe((event) => {
      localStorage.setItem(userLocaleKey, event.lang);
      this.paTranslate.initTranslationsAndUse(event.lang, event.translations);
    });
  }

  private updateStateOnRouteChange() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap((event) => this.tracking.navigation(event as NavigationEnd)),
        filter(
          (event) =>
            ((event as NavigationEnd).url.startsWith('/at/') ||
              (event as NavigationEnd).url.startsWith('/select-account-kb/')) &&
            !!this.router.routerState.root.firstChild?.firstChild,
        ),
        switchMap(() =>
          combineLatest([
            this.router.routerState.root.firstChild?.firstChild?.paramMap || of(undefined),
            this.router.routerState.root.firstChild?.firstChild?.firstChild?.paramMap || of(undefined),
          ]),
        ),
        filter(([accountParams]) => !!accountParams?.get('account')),
        switchMap(([accountParams, kbParams]) =>
          combineLatest([
            this.sdk.setCurrentAccount(accountParams?.get('account') as string),
            kbParams && kbParams.get('stash')
              ? this.sdk.setCurrentKnowledgeBox(
                  accountParams?.get('account') as string,
                  kbParams.get('stash') as string,
                )
              : of(undefined),
          ]).pipe(
            catchError((error) => {
              if (error.status === 403) {
                this.navigation.resetState();
              }
              return of([{ title: '' }, { title: '' }]);
            }),
          ),
        ),
      )
      .subscribe(([account, kb]) =>
        kb
          ? this.titleService.setTitle(`Nuclia – ${account.title} – ${kb.title}`)
          : this.titleService.setTitle(`Nuclia – ${account.title}`),
      );
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
}
