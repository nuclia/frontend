import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatest, map, filter } from 'rxjs';
import { UploadService } from '../../upload/upload.service';
import { UploadFilesDialogComponent } from '../../upload/upload-files/upload-files-dialog.component';

@Component({
  selector: 'app-knowledge-box',
  templateUrl: './knowledge-box.component.html',
  styleUrls: ['./knowledge-box.component.scss'],
})
export class KnowledgeBoxComponent implements OnDestroy {
  showBar = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );
  private unsubscribeAll = new Subject<void>();

  constructor(private uploadService: UploadService, private activatedRoute: ActivatedRoute, private dialog: MatDialog) {
    this.activatedRoute.queryParams.pipe(filter((params) => !!params.firstUpload)).subscribe(() => {
      this.dialog.open(UploadFilesDialogComponent, {
        data: { folderMode: false },
      });
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
