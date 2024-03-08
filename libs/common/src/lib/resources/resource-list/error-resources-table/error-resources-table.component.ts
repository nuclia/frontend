import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { map } from 'rxjs';
import { RESOURCE_STATUS } from '@nuclia/core';
import { UploadService } from '../../../upload/upload.service';

@Component({
  selector: 'stf-error-resources-table',
  templateUrl: './error-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorResourcesTableComponent extends ResourcesTableDirective {
  override status: RESOURCE_STATUS = RESOURCE_STATUS.ERROR;
  private uploadService = inject(UploadService);
  totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.error));
}
