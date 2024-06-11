import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { InfoCardComponent, SisModalService } from '@nuclia/sistema';
import { CreateWidgetDialogComponent } from './create-widget-dialog/create-widget-dialog.component';
import { filter, map, switchMap, take } from 'rxjs';
import { DEFAULT_WIDGET_CONFIG, NUCLIA_STANDARD_SEARCH_CONFIG } from '../search-widget.models';
import { SDKService } from '@flaps/core';
import { SearchWidgetService } from '../search-widget.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'stf-widget-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaButtonModule, InfoCardComponent],
  templateUrl: './widget-list.component.html',
  styleUrl: './widget-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetListComponent {
  private sdk = inject(SDKService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private searchWidgetService = inject(SearchWidgetService);
  private modalService = inject(SisModalService);

  createWidget() {
    this.modalService
      .openModal(CreateWidgetDialogComponent)
      .onClose.pipe(
        filter((confirmed) => !!confirmed),
        map((widgetName) => widgetName as string),
        switchMap((widgetName) =>
          this.sdk.currentKb.pipe(
            take(1),
            map((kb) =>
              this.searchWidgetService.createWidget(
                kb.id,
                widgetName,
                DEFAULT_WIDGET_CONFIG,
                NUCLIA_STANDARD_SEARCH_CONFIG.id,
              ),
            ),
            switchMap((widgetSlug) => this.router.navigate(['.', widgetSlug], { relativeTo: this.route })),
          ),
        ),
      )
      .subscribe();
  }
}
