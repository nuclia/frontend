import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { SearchWidgetService } from '@flaps/common';
import { OptionModel, OptionSeparator, OptionType } from '@guillotinaweb/pastanaga-angular';
import { TranslateService } from '@ngx-translate/core';
import { catchError, delay, forkJoin, map, of, Subject, switchMap, take, timeout } from 'rxjs';
import { SDKService } from '@flaps/core';
import { NUCLIA_STANDARD_SEARCH_CONFIG, NUCLIA_STANDARD_SEARCH_CONFIG_ID, Widget } from '@nuclia/core';

@Component({
  selector: 'app-reader-experience',
  standalone: false,
  templateUrl: './reader-experience.component.html',
  styleUrls: ['./reader-experience.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReaderExperienceComponent {
  private el = inject(ElementRef);
  private searchWidgetService = inject(SearchWidgetService);
  private sdk = inject(SDKService);
  private translate = inject(TranslateService);

  widgetPreview = this.searchWidgetService.widgetPreview;
  view = signal<'idle' | 'search'>('idle');

  private _searchConfigurations = toSignal(this.searchWidgetService.searchConfigurations, {
    initialValue: [] as Widget.AnySearchConfiguration[],
  });
  private _currentKbId = toSignal(this.sdk.currentKb.pipe(map((kb) => kb.id)), { initialValue: '' });

  readerConfigControl = new FormControl<string>(NUCLIA_STANDARD_SEARCH_CONFIG_ID);
  configOptions = computed<OptionType[]>(() => {
    const configs = this._searchConfigurations();
    const standardOption = new OptionModel({
      id: NUCLIA_STANDARD_SEARCH_CONFIG_ID,
      value: NUCLIA_STANDARD_SEARCH_CONFIG_ID,
      label: this.translate.instant('search.configuration.options.nuclia-standard'),
    });
    const customConfigs = configs.filter((c) => c.id !== NUCLIA_STANDARD_SEARCH_CONFIG_ID);
    const options: OptionType[] = [standardOption];
    if (customConfigs.length > 0) {
      options.push(new OptionSeparator());
      customConfigs.forEach((c) => options.push(new OptionModel({ id: c.id, value: c.id, label: c.id })));
    }
    return options;
  });

  /** Fires each time `initWidget()` is called; switchMap cancels any pending listener-attachment. */
  private _widgetReady = new Subject<void>();

  constructor() {
    this._widgetReady
      .pipe(
        switchMap(() => of(null).pipe(delay(1000))),
        takeUntilDestroyed(),
      )
      .subscribe(() => this._attachWidgetListeners());

    forkJoin([
      this.sdk.currentKb.pipe(take(1)),
      this.searchWidgetService.searchConfigurations.pipe(
        take(1),
        timeout(5000),
        catchError(() => of([] as Widget.AnySearchConfiguration[])),
      ),
    ]).subscribe(([kb, configs]) => {
      const savedConfig = this.searchWidgetService.getSelectedSearchConfig(kb.id, configs);
      this.readerConfigControl.patchValue(savedConfig.id);
      this.initWidget(savedConfig);
    });
  }

  ngOnDestroy() {
    this.searchWidgetService.resetSearchQuery();
  }

  initWidget(config: Widget.AnySearchConfiguration = NUCLIA_STANDARD_SEARCH_CONFIG) {
    this.searchWidgetService.generateWidgetSnippet(config);
    this._widgetReady.next();
  }

  onConfigSelect(configId: string) {
    const configs = this._searchConfigurations();
    const selected = configs.find((c) => c.id === configId) || NUCLIA_STANDARD_SEARCH_CONFIG;
    this.searchWidgetService.saveSelectedSearchConfig(this._currentKbId(), configId);
    this.searchWidgetService.resetSearchQuery();
    this.view.set('idle');
    this.initWidget(selected);
  }

  private _attachWidgetListeners() {
    const host = this.el.nativeElement.querySelector('nuclia-search-bar');
    host?.addEventListener('search', () => this.view.set('search'));
    host?.addEventListener('resetQuery', () => this.view.set('idle'));
    this._applyShadowDomStyles(host);
  }

  private _applyShadowDomStyles(host: Element | null) {
    if (!host?.shadowRoot) {
      return;
    }
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(`
      form.sw-search-input {
        width: 100%!important;
        max-width: 100%!important;
      }
    `);
    host.shadowRoot.adoptedStyleSheets = [...host.shadowRoot.adoptedStyleSheets, sheet];
  }
}
