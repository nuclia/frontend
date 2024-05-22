import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RESOURCE_STATUS } from '@nuclia/core';
import { UploadService } from '../../../upload';
import { map } from 'rxjs';
import { ResourcesTableComponent } from '../resources-table/resources-table.component';

@Component({
  selector: 'stf-processed-resources-table',
  templateUrl: '../resources-table/resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessedResourcesTableComponent extends ResourcesTableComponent {
  override status: RESOURCE_STATUS = RESOURCE_STATUS.PROCESSED;
  override uploadService = inject(UploadService);
  override totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.processed));
}
