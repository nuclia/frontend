import { Component } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { UploadService } from '../../upload/upload.service';

@Component({
  selector: 'app-knowledge-box',
  templateUrl: './knowledge-box.component.html',
  styleUrls: ['./knowledge-box.component.scss'],
})
export class KnowledgeBoxComponent {
  showBar = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled)
  );

  constructor(private uploadService: UploadService) {}
}
