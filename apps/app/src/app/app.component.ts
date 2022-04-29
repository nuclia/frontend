import { Component, AfterViewInit, OnInit, OnDestroy, ViewChild, ViewContainerRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { STFUtils } from '@flaps/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  UserService,
  STFTrackingService,
  STFSplashScreenService,
  BackendConfigurationService,
  AuthService,
  StateService,
  SDKService,
} from '@flaps/auth';
import { catchError, combineLatest, filter, of, Subject, switchMap, tap } from 'rxjs';
import { NavigationService } from './services/navigation.service';
import { resetStateOn403 } from './resolvers/utils';
import { Title } from '@angular/platform-browser';
import { Toaster } from '@flaps/pastanaga';

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
    private router: Router,
    private state: StateService,
    private user: UserService,
    private authService: AuthService,
    private spashService: STFSplashScreenService,
    private translate: TranslateService,
    private tracking: STFTrackingService,
    private config: BackendConfigurationService,
    private navigation: NavigationService,
    private sdk: SDKService,
    private titleService: Title,
    private toaster: Toaster,
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
      this.authService.removeLocalCreds();
    });
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
    if (this.toastsContainer) {
      this.toaster.registerContainer(this.toastsContainer);
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngAfterViewInit() {
    this.spashService.hide();
  }

  initTranslate(userLocale?: string) {
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
        filter(([accountParams, kbParams]) => !!accountParams.get('account')),
        switchMap(([accountParams, kbParams]) =>
          combineLatest([
            this.sdk.setCurrentAccount(accountParams.get('account') as string),
            kbParams && kbParams.get('stash')
              ? this.sdk.setCurrentKnowledgeBox(accountParams.get('account') as string, kbParams.get('stash') as string)
              : of(),
          ]),
        ),
        catchError(resetStateOn403(this.navigation, this.state, this.router)),
      )
      .subscribe(([account, kb]) => this.titleService.setTitle(`Nuclia – ${account.title} – ${kb.title}`));
  }
}
