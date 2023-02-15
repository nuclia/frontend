import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  BackendConfigurationService,
  SDKService,
  StateService,
  STFSplashScreenService,
  STFTrackingService,
  STFUtils,
  UserService,
} from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import { catchError, combineLatest, filter, of, Subject, switchMap, take, tap } from 'rxjs';
import { NavigationService } from './services/navigation.service';
import { Title } from '@angular/platform-browser';
import { ModalConfig, TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { takeUntil } from 'rxjs/operators';
import { SisModalService } from '@nuclia/sistema';
import { MessageModalComponent } from './components/messages/message-modal.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;
  version: string | undefined;

  private unsubscribeAll: Subject<void>;

  constructor(
    private state: StateService,
    private router: Router,
    private user: UserService,
    private splashScreenService: STFSplashScreenService,
    private ngxTranslate: TranslateService,
    private tracking: STFTrackingService,
    private config: BackendConfigurationService,
    private navigation: NavigationService,
    private sdk: SDKService,
    private titleService: Title,
    private paTranslate: PaTranslateService,
    private modalService: SisModalService,
  ) {
    this.unsubscribeAll = new Subject();

    this.updateStateOnRouteChange();

    this.initTranslate(undefined);
    this.user.userPrefs.subscribe((prefs) => {
      this.initTranslate(prefs?.language?.toLowerCase());
    });
    this.sdk.nuclia.auth.hasLoggedOut().subscribe(() => {
      this.tracking.logout();
      this.router.navigate(['/user/login']);
      this.state.cleanAccount();
      this.state.cleanStash();
    });
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

  private updateStateOnRouteChange() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        tap((event) => this.tracking.navigation(event as NavigationEnd)),
        filter(
          (event) =>
            ((event as NavigationEnd).url.startsWith('/at/') || (event as NavigationEnd).url.startsWith('/select/')) &&
            !!this.router.routerState.root.firstChild?.firstChild,
        ),
        switchMap(() =>
          combineLatest([
            this.router.routerState.root.firstChild!.firstChild!.paramMap,
            this.router.routerState.root.firstChild?.firstChild?.firstChild?.paramMap || of(),
          ]),
        ),
        filter(([accountParams]) => !!accountParams.get('account')),
        switchMap(([accountParams, kbParams]) =>
          combineLatest([
            this.sdk.setCurrentAccount(accountParams.get('account') as string),
            kbParams && kbParams.get('stash')
              ? this.sdk.setCurrentKnowledgeBox(accountParams.get('account') as string, kbParams.get('stash') as string)
              : of(),
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
      .subscribe(([account, kb]) => this.titleService.setTitle(`Nuclia – ${account.title} – ${kb.title}`));
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
}
