import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { UploadListComponent } from '../upload-list/upload-list.component';
import { ItemToUpload } from '../getting-started.models';
import { FormatDurationPipe } from '@flaps/common';

@Component({
  selector: 'app-getting-started-processing',
  imports: [TranslateModule, UploadListComponent, FormatDurationPipe],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessingComponent {
  @Input() itemsToUpload: ItemToUpload[] = [];
  @Input() totalEstimatedTime?: number;
}
