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
import { TranslatePipe } from '@ngx-translate/core';
import { SisProgressModule, StickyFooterComponent } from '@nuclia/sistema';
import { map } from 'rxjs';
import { UploadService } from '../../../upload';
import { ColumnHeader } from '../resource-list.model';
import { COMMON_COLUMNS, ResourcesTableDirective } from '../resources-table.directive';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { TitleCellComponent } from '../title-cell/title-cell.component';

@Component({
  selector: 'stf-pending-resources-table',
  templateUrl: './pending-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
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
  ],
})
export class PendingResourcesTableComponent extends ResourcesTableDirective {
  private uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.pending));

  protected override defaultColumns: ColumnHeader[] = [
    ...COMMON_COLUMNS,
    { id: 'status', label: 'resource.status.column-title', size: 'minmax(176px, 1fr)', centered: true },
  ];
}
