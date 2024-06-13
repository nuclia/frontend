import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BackButtonComponent, SisToastService } from '@nuclia/sistema';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SearchConfiguration, SearchConfigurationComponent, Widget } from '../..';
import { SearchWidgetService } from '../../search-widget.service';
import { filter, map, Subject, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil, tap } from 'rxjs/operators';
import { deepEqual, SDKService } from '@flaps/core';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    BackButtonComponent,
    TranslateModule,
    PaButtonModule,
    AccordionItemComponent,
    AccordionBodyDirective,
    PaTogglesModule,
    SearchConfigurationComponent,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './widget-form.component.html',
  styleUrl: './widget-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class WidgetFormComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private sdk = inject(SDKService);
  private searchWidgetService = inject(SearchWidgetService);
  private translate = inject(TranslateService);
  private toaster = inject(SisToastService);

  private unsubscribeAll = new Subject<void>();

  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;

  savedWidget?: Widget;
  currentWidget?: Widget;
  isNotModified = true;

  form = new FormGroup({
    popupStyle: new FormControl<'page' | 'popup'>('page', { nonNullable: true }),
    darkMode: new FormControl<'light' | 'dark'>('light', { nonNullable: true }),
    hideLogo: new FormControl<boolean>(false, { nonNullable: true }),
    permalink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToLink: new FormControl<boolean>(false, { nonNullable: true }),
    navigateToFile: new FormControl<boolean>(false, { nonNullable: true }),
  });

  widgetFormExpanded = true;

  widgetPreview = this.searchWidgetService.widgetPreview;
  currentConfig?: SearchConfiguration;

  get darkModeEnabled() {
    return this.form.controls.darkMode.value === 'dark';
  }

  ngOnInit() {
    this.route.params
      .pipe(
        filter((params) => !!params['slug']),
        map((params) => params['slug'] as string),
        switchMap((widgetSlug) =>
          this.sdk.currentKb.pipe(
            take(1),
            map((kb) => ({ kbId: kb.id, widgetSlug })),
          ),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(({ kbId, widgetSlug }) => {
        this.savedWidget = this.searchWidgetService.getSavedWidget(kbId, widgetSlug);
        if (!this.savedWidget) {
          this.toaster.error(this.translate.instant('search.widgets.errors.widget-not-found', { widgetSlug }));
          this.router.navigate(['..'], { relativeTo: this.route });
        } else {
          this.currentWidget = { ...this.savedWidget };
        }
        this.cdr.detectChanges();
      });

    this.form.valueChanges
      .pipe(
        filter(() => !!this.currentConfig),
        map((newValue) => ({ searchConfig: this.currentConfig as SearchConfiguration, widgetConfig: newValue })),
        tap(({ widgetConfig }) => {
          if (this.currentWidget) {
            this.currentWidget.widgetConfig = this.form.getRawValue();
          }
          if (!widgetConfig.permalink) {
            this.removeQueryParams();
          }
        }),
        switchMap(({ searchConfig }) =>
          this.searchWidgetService.generateWidgetSnippet(searchConfig, this.form.getRawValue()),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => this.checkIsModified());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  saveChanges() {
    //TODO
  }

  rename() {
    if (this.savedWidget) {
      const widget = this.savedWidget;
      this.searchWidgetService.renameWidget(this.savedWidget.slug, this.savedWidget.name).subscribe((newName) => {
        widget.name = newName;
        if (this.currentWidget) {
          this.currentWidget.name = newName;
        }
        this.cdr.markForCheck();
      });
    }
  }

  duplicateAsNew() {
    if (this.savedWidget) {
      this.searchWidgetService
        .duplicateWidget(this.savedWidget)
        .subscribe((slug) => this.router.navigate(['..', slug], { relativeTo: this.route }));
    }
  }

  delete() {
    if (this.savedWidget) {
      this.searchWidgetService
        .deleteWidget(this.savedWidget.slug, this.savedWidget.name)
        .subscribe(() => this.router.navigate(['..'], { relativeTo: this.route }));
    }
  }

  private removeQueryParams() {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => Object.keys(params).length > 0),
      )
      .subscribe(() => this.router.navigate([]));
  }

  private checkIsModified() {
    if (this.savedWidget && this.currentWidget) {
      this.isNotModified = deepEqual(this.savedWidget, this.currentWidget);
      this.cdr.markForCheck();
    }
  }

  updateSearchConfig(searchConfig: SearchConfiguration) {
    this.currentConfig = searchConfig;
    this.isNotModified = searchConfig.id === this.savedWidget?.searchConfigId;
    this.cdr.markForCheck();
  }
}
