import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { STFUtils } from '@flaps/core';
import { STFTrackingService, STFSplashScreenService, BackendConfigurationService } from '@flaps/auth';
import { Subject } from 'rxjs';

@Component({
  selector: 'flaps-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  title = 'login';
  version: string | undefined;

  private unsubscribeAll: Subject<void>;

  constructor(
    private router: Router,
    private spashService: STFSplashScreenService,
    private translate: TranslateService,
    private tracking: STFTrackingService,
    private config: BackendConfigurationService
  ) {
    this.unsubscribeAll = new Subject();
    this.initTranslate();
  }

  ngOnInit(): void {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  ngAfterViewInit() {
    this.spashService.hide();
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // if (!event.url.startsWith('/stash/') && ((event.url.match(/\//g) || []).length < 5)) {
        if (event.url.indexOf('?') === -1 && (event.url.match(/\//g) || []).length < 5) {
          this.spashService.show();
        }
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        this.tracking.navigation(event);
        if (this.spashService.shown) {
          this.spashService.hide();
        }
      }
    });
  }

  initTranslate() {
    this.translate.setDefaultLang('en');
    const browserLang = this.translate.getBrowserLang();

    if (browserLang && STFUtils.supportedLanguages().indexOf(browserLang) > -1) {
      this.translate.use(browserLang);
    } else {
      this.translate.use('en');
    }
  }
}
