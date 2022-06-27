import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Subject, combineLatest, map, filter, takeUntil, tap, switchMap, of } from 'rxjs';
import { UploadService } from '../../upload/upload.service';
import { AppService } from '../../services/app.service';
import { STFConfirmComponent } from '@flaps/components';
import { UploadFilesDialogComponent } from '../../upload/upload-files/upload-files-dialog.component';

@Component({
  selector: 'app-knowledge-box',
  templateUrl: './knowledge-box.component.html',
  styleUrls: ['./knowledge-box.component.scss'],
})
export class KnowledgeBoxComponent implements OnInit, OnDestroy {
  showBar = combineLatest([this.uploadService.progress, this.uploadService.barDisabled]).pipe(
    map(([progress, disabled]) => !progress.completed && !disabled),
  );
  private unsubscribeAll = new Subject<void>();

  constructor(
    private uploadService: UploadService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private appService: AppService,
  ) {
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((params) => !!params.firstUpload),
      )
      .subscribe(() => {
        this.openUploadDialog();
      });
  }

  ngOnInit() {
    this.appService
      .checkEmptyKBAlert()
      .pipe(
        takeUntil(this.unsubscribeAll),
        switchMap((result) => (result ? this.showKBEmptyAlert() : of())),
      )
      .subscribe();
  }

  showKBEmptyAlert() {
    return this.dialog
      .open(STFConfirmComponent, {
        width: '560px',
        data: {
          title: 'stash.empty_kb',
          message: 'stash.upload_to_search',
          confirmText: 'stash.upload_data',
          minWidthButtons: '110px',
        },
      })
      .afterClosed()
      .pipe(
        takeUntil(this.unsubscribeAll),
        filter((result) => !!result),
        tap(() => {
          this.openUploadDialog();
        }),
      );
  }

  openUploadDialog() {
    this.dialog.open(UploadFilesDialogComponent, {
      data: { folderMode: false },
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
