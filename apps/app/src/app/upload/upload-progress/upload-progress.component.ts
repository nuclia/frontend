import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { filter, map, takeUntil } from 'rxjs/operators';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadProgressComponent {
  @Output() close = new EventEmitter<void>();
  progress = this.uploadService.progress.pipe(takeUntil(this.close));

  constructor(private uploadService: UploadService) {}
}
