import { Component } from '@angular/core';
import { map } from 'rxjs';
import { UploadService } from '../../upload/upload.service';

@Component({
  selector: 'app-knowledge-box',
  templateUrl: './knowledge-box.component.html',
  styleUrls: ['./knowledge-box.component.scss'],
})
export class KnowledgeBoxComponent {
  uploading = this.uploadService.progress.pipe(map((p) => !p.completed));

  constructor(private uploadService: UploadService) {}
}
