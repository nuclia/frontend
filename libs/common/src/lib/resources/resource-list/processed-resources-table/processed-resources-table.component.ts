import { AsyncPipe, DatePipe, KeyValuePipe, SlicePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LabelModule } from '@flaps/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTableModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslatePipe } from '@ngx-translate/core';
import {
  DropdownButtonComponent,
  NsiSkeletonComponent,
  SisLabelModule,
  SisProgressModule,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { map } from 'rxjs';
import { UploadService } from '../../../upload';
import { ResourcesTableComponent } from '../resources-table/resources-table.component';
import { TablePaginationComponent } from '../table-pagination/table-pagination.component';
import { TitleCellComponent } from '../title-cell/title-cell.component';

@Component({
  selector: 'stf-processed-resources-table',
  templateUrl: '../resources-table/resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SisProgressModule,
    PaButtonModule,
    LabelModule,
    DropdownButtonComponent,
    PaDropdownModule,
    PaTogglesModule,
    PaTableModule,
    PaTooltipModule,
    NsiSkeletonComponent,
    TitleCellComponent,
    SisLabelModule,
    PaIconModule,
    PaPopupModule,
    StickyFooterComponent,
    TablePaginationComponent,
    AsyncPipe,
    SlicePipe,
    DatePipe,
    KeyValuePipe,
    TranslatePipe,
    TranslateModule,
  ],
})
export class ProcessedResourcesTableComponent extends ResourcesTableComponent {
  override uploadService = inject(UploadService);
  override totalCount = this.uploadService.statusCount.pipe(map((statusCount) => statusCount.processed));
}
