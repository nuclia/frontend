import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { combineLatest, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { UploadService } from '../../upload/upload.service';
import { AppService } from '../../services/app.service';
import { UploadFilesDialogComponent } from '../../upload/upload-files/upload-files-dialog.component';
import { SisModalService } from '@nuclia/sistema';

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
    private modalService: SisModalService,
  ) {
    this.activatedRoute.queryParams
      .pipe(
        filter((params) => !!params.firstUpload),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe(() => {
        this.openUploadDialog();
      });
  }

  ngOnInit() {
    this.appService
      .isKbStillEmptyAfterFirstDay()
      .pipe(
        switchMap((result) => (result ? this.showKBEmptyAlert() : of(undefined))),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  showKBEmptyAlert() {
    return this.modalService
      .openConfirm({
        title: 'stash.empty_kb',
        description: 'stash.upload_to_search',
        confirmLabel: 'stash.upload_data',
      })
      .onClose.pipe(
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
