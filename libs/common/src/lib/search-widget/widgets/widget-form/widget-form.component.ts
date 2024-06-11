import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BackButtonComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import {
  AccordionBodyDirective,
  AccordionItemComponent,
  PaButtonModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SearchConfigurationComponent } from '../../search-configuration';
import { SearchWidgetService } from '../../search-widget.service';
import { filter, map, Subject, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntil, tap } from 'rxjs/operators';
import { SearchConfiguration } from '@flaps/common';

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
  ],
  templateUrl: './widget-form.component.html',
  styleUrl: './widget-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetFormComponent implements OnInit, OnDestroy {
  private searchWidgetService = inject(SearchWidgetService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private unsubscribeAll = new Subject<void>();

  @ViewChild('configurationContainer') configurationContainerElement?: ElementRef;

  widgetName = 'TODO';

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
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((widgetSlug) => {
        // FIXME: get widget from local storage
        this.widgetName = widgetSlug;
      });

    this.form.valueChanges
      .pipe(
        filter(() => !!this.currentConfig),
        map((newValue) => ({ searchConfig: this.currentConfig as SearchConfiguration, widgetConfig: newValue })),
        tap(({ widgetConfig }) => {
          if (!widgetConfig.permalink) {
            this.removeQueryParams();
          }
        }),
        switchMap(({ searchConfig }) =>
          this.searchWidgetService.generateWidgetSnippet(searchConfig, this.form.getRawValue()),
        ),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {});
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  private removeQueryParams() {
    this.route.queryParams
      .pipe(
        take(1),
        filter((params) => Object.keys(params).length > 0),
      )
      .subscribe(() => this.router.navigate([]));
  }
}
