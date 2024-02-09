import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BackendConfigurationService, NavigationService, SDKService, STFTrackingService, STFUtils } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { filter, Subject, take } from 'rxjs';
import { ModalConfig, TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';
import { SisModalService } from '@nuclia/sistema';
import { MessageModalComponent } from '@flaps/common';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';

const userLocaleKey = 'NUCLIA_USER_LOCALE';

@Component({
  selector: 'nad-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;
  version?: string;

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(
    private ngxTranslate: TranslateService,
    private config: BackendConfigurationService,
    private paTranslate: PaTranslateService,
    private tracking: STFTrackingService,
    private modalService: SisModalService,
    private sdk: SDKService,
    private titleService: Title,
    private navigation: NavigationService,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => this.tracking.navigation(event as NavigationEnd));

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
