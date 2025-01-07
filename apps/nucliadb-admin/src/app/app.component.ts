import { Component, OnDestroy, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { BackendConfigurationService, STFUtils } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { TranslateService as PaTranslateService } from '@guillotinaweb/pastanaga-angular';

const userLocaleKey = 'NUCLIA_USER_LOCALE';

@Component({
  selector: 'nad-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('toastsContainer', { read: ViewContainerRef, static: true }) toastsContainer?: ViewContainerRef;
  version?: string;

  private unsubscribeAll: Subject<void> = new Subject<void>();

  constructor(
    private ngxTranslate: TranslateService,
    private config: BackendConfigurationService,
    private paTranslate: PaTranslateService,
  ) {
    if (location.href.includes('/admin/admin/')) {
      // after OAuth flow, we need to restore hash-based routing
      location.href = decodeURIComponent(location.href.replace('/admin/admin/', '/admin/#/admin/'));
    }

    const userLocale = localStorage.getItem(userLocaleKey);
    this.initTranslate(userLocale);
  }

  ngOnInit() {
    if (this.config.getVersion()) {
      this.version = this.config.getVersion();
    }
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
}
