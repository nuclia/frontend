import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import { SisProgressModule, StickyFooterComponent } from '@nuclia/sistema';
import { map } from 'rxjs';
import { UploadService } from '../../../upload/upload.service';
import { ColumnHeader } from '../resource-list.model';
import { COMMON_COLUMNS, ResourcesTableDirective } from '../resources-table.directive';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { TitleCellComponent } from '../title-cell/title-cell.component';

@Component({
  selector: 'stf-error-resources-table',
  templateUrl: './error-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss', './error-resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SisProgressModule,
    PaButtonModule,
    PaTableModule,
    PaTogglesModule,
    PaTooltipModule,
    TitleCellComponent,
    PaPopupModule,
    PaDropdownModule,
    StickyFooterComponent,
    TablePaginationComponent,
    AsyncPipe,
    DatePipe,
    TranslatePipe,
    TranslateModule,
  ],
})
export class ErrorResourcesTableComponent extends ResourcesTableDirective {
  private uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.error));

  protected override defaultColumns: ColumnHeader[] = [
    ...COMMON_COLUMNS,
    { id: 'errors', label: 'resource.errors', size: 'minmax(280px, 1.5fr)' },
  ];
}
