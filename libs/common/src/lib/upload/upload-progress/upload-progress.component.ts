import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { map, takeUntil } from 'rxjs/operators';
import { UploadService } from '../upload.service';
import { Observable } from 'rxjs';
import { FileUploadStatus } from '@nuclia/core';

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadProgressComponent {
  @Output() close = new EventEmitter<void>();
  files: Observable<FileUploadStatus[]> = this.uploadService.progress.pipe(
    map((progress) => progress.files || []),
    takeUntil(this.close),
  );

  constructor(private uploadService: UploadService) {}
}
