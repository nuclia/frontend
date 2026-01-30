import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent } from './dialogs';
import { filter, forkJoin, map, Observable, switchMap, take } from 'rxjs';
import { DEFAULT_RAO_WIDGET_CONFIG, DEFAULT_WIDGET_CONFIG } from '../search-widget.models';
import { NavigationService, SDKService } from '@flaps/core';
import { SearchWidgetService } from '../search-widget.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '@nuclia/core';

@Component({
  selector: 'stf-widget-list',
  imports: [
    CommonModule,
    TranslateModule,
    PaButtonModule,
    InfoCardComponent,
    PaTableModule,
    PaDateTimeModule,
    RouterLink,
    PaDropdownModule,
    PaPopupModule,
  ],
  templateUrl: './widget-list.component.html',
  styleUrl: './widget-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetListComponent implements OnInit {
  private sdk = inject(SDKService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);
  private navigationService = inject(NavigationService);

  inArag = this.navigationService.inArag();
  widgetList = this.searchWidgetService.widgetList;
  emptyList: Observable<boolean> = this.widgetList.pipe(map((list) => list.length === 0));
  modelNames: { [key: string]: string } = {};

  ngOnInit() {
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.getLearningSchema().pipe(map((schema) => ({ kb, schema })))),
      )
      .subscribe(({ kb, schema }) => {
        this.modelNames =
          schema['generative_model']?.options?.reduce(
            (acc, model) => {
              acc[model.value] = model.name;
              return acc;
            },
            {} as { [key: string]: string },
          ) || {};
      });
  }

  createWidget() {
    this.modalService
      .openModal(CreateWidgetDialogComponent)
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        map((widgetName) => widgetName as string),
        switchMap((widgetName) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => forkJoin([kb.getConfiguration(), this.inArag.pipe(take(1))])),
            switchMap(([configuration, inArag]) => {
              if (inArag) {
                return this.searchWidgetService.createRaoWidget(widgetName, DEFAULT_RAO_WIDGET_CONFIG);
              }
              return this.searchWidgetService.createWidget(
                widgetName,
                DEFAULT_WIDGET_CONFIG,
                NUCLIA_STANDARD_SEARCH_CONFIG.id,
                configuration['generative_model'] || '',
                configuration['default_semantic_model'] || '',
              );
            }),
            switchMap((widgetSlug) => this.router.navigate(['.', widgetSlug], { relativeTo: this.route })),
          ),
        ),
      )
      .subscribe();
  }

  openPreview(slug: string) {
    this.router.navigate(['./', slug], { relativeTo: this.route });
  }

  rename(slug: string, name: string) {
    this.searchWidgetService.renameWidget(slug, name).subscribe();
  }

  duplicateAsNew(widget: Widget.Widget) {
    this.searchWidgetService
      .duplicateWidget(widget)
      .subscribe((slug) => this.router.navigate(['./', slug], { relativeTo: this.route }));
  }

  delete(slug: string, name: string) {
    this.searchWidgetService.deleteWidget(slug, name).subscribe();
  }
}
