import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  ModalConfig,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
} from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent, RenameWidgetDialogComponent } from './dialogs';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { DEFAULT_WIDGET_CONFIG, NUCLIA_STANDARD_SEARCH_CONFIG, Widget } from '../search-widget.models';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../search-widget.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DuplicateWidgetDialogComponent } from './dialogs/duplicate-widget-dialog/duplicate-widget-dialog.component';

@Component({
  selector: 'stf-widget-list',
  standalone: true,
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
  private translate = inject(TranslateService);

  widgetList = this.searchWidgetService.widgetList;
  emptyList: Observable<boolean> = this.widgetList.pipe(map((list) => list.length === 0));

  ngOnInit() {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => this.searchWidgetService.initWidgetList(kb.id));
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
            switchMap((kb) =>
              kb
                .getConfiguration()
                .pipe(
                  map((configuration) =>
                    this.searchWidgetService.createWidget(
                      kb.id,
                      widgetName,
                      DEFAULT_WIDGET_CONFIG,
                      NUCLIA_STANDARD_SEARCH_CONFIG.id,
                      configuration['generative_model'] || '',
                    ),
                  ),
                ),
            ),
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
    this.modalService
      .openModal(RenameWidgetDialogComponent, new ModalConfig({ data: { name } }))
      .onClose.pipe(
        filter((newName) => !!newName),
        map((newName) => newName as string),
        switchMap((newName) =>
          this.sdk.currentKb.pipe(
            take(1),
            map((kb) => ({ kbId: kb.id, newName })),
          ),
        ),
      )
      .subscribe(({ kbId, newName }) => this.searchWidgetService.renameWidget(kbId, slug, newName));
  }

  duplicateAsNew(widget: Widget) {
    this.modalService
      .openModal(DuplicateWidgetDialogComponent, new ModalConfig({ data: { name: widget.name } }))
      .onClose.pipe(
        filter((newName) => !!newName),
        map((newName) => newName as string),
        switchMap((newName) =>
          this.sdk.currentKb.pipe(
            take(1),
            map((kb) => ({ kbId: kb.id, newName })),
          ),
        ),
      )
      .subscribe(({ kbId, newName }) => {
        const slug = this.searchWidgetService.duplicateWidget(kbId, widget, newName);
        this.router.navigate(['./', slug], { relativeTo: this.route });
      });
  }

  delete(slug: string, name: string) {
    this.modalService
      .openConfirm({
        title: this.translate.instant('search.widgets.dialog.delete-widget.title', { name }),
        description: 'search.widgets.dialog.delete-widget.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        switchMap(() => this.sdk.currentKb.pipe(take(1))),
      )
      .subscribe((kb) => this.searchWidgetService.deleteWidget(kb.id, slug));
  }
}
