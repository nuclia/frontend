import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { UploadListComponent } from '../upload-list/upload-list.component';
import { ItemToUpload } from '../getting-started.models';

const ESTIMATED_TIME_PER_RESOURCE = 5; // in minutes

@Component({
  selector: 'app-getting-started-processing',
  standalone: true,
  imports: [CommonModule, TranslateModule, UploadListComponent],
  templateUrl: './processing.component.html',
  styleUrl: './processing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessingComponent {
  @Input() itemsToUpload: ItemToUpload[] = [];
  @Input() totalEstimatedTime?: number;
}
