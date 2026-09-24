import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { STFPipesModule } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FileUploadStatus } from '@nuclia/core';
import { ProgressBarComponent } from '@nuclia/sistema';
import { Observable } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { UploadService } from '../upload.service';

@Component({
  selector: 'app-upload-progress',
  templateUrl: './upload-progress.component.html',
  styleUrls: ['./upload-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaModalModule,
    PaIconModule,
    ProgressBarComponent,
    PaButtonModule,
    AsyncPipe,
    TranslatePipe,
    STFPipesModule,
  ],
})
export class UploadProgressComponent {
  @Output() progressClose = new EventEmitter<void>();
  files: Observable<FileUploadStatus[]> = this.uploadService.progress.pipe(
    map((progress) => progress.files || []),
    takeUntil(this.progressClose),
  );

  constructor(private uploadService: UploadService) {}
}
