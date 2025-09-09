import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { COMMON_COLUMNS, ResourcesTableDirective } from '../resources-table.directive';
import { ColumnHeader } from '../resource-list.model';
import { RESOURCE_STATUS } from '@nuclia/core';
import { UploadService } from '../../../upload';
import { map, of } from 'rxjs';

@Component({
  selector: 'stf-pending-resources-table',
  templateUrl: './pending-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class PendingResourcesTableComponent extends ResourcesTableDirective {
  override status: RESOURCE_STATUS = RESOURCE_STATUS.PENDING;
  private uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.pending));

  protected override defaultColumns: ColumnHeader[] = [
    ...COMMON_COLUMNS,
    { id: 'status', label: 'resource.status.column-title', size: 'minmax(176px, 1fr)', centered: true },
  ];
}
