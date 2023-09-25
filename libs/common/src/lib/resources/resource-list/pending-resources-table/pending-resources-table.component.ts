import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COMMON_COLUMNS, ResourcesTableDirective } from '../resources-table.directive';
import { ColumnHeader } from '../resource-list.model';
import { RESOURCE_STATUS } from '@nuclia/core';

@Component({
  selector: 'stf-pending-resources-table',
  templateUrl: './pending-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingResourcesTableComponent extends ResourcesTableDirective {
  override status: RESOURCE_STATUS = RESOURCE_STATUS.PENDING;

  protected override defaultColumns: ColumnHeader[] = [
    ...COMMON_COLUMNS,
    { id: 'status', label: 'resource.status', size: 'minmax(176px, 1fr)', centered: true },
  ];
}
