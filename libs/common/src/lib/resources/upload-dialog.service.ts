import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateLinkComponent, UploadFilesDialogComponent, UploadTextComponent } from '@flaps/common';

export type UploadType = 'files' | 'folder' | 'link' | 'csv';

@Injectable({
  providedIn: 'root',
})
export class UploadDialogService {
  constructor(
    private dialog: MatDialog, //FIXME replace old upload dialog with sistema modal service
  ) {}

  upload(
    type: 'files' | 'folder' | 'link' | 'csv',
  ): MatDialogRef<CreateLinkComponent | UploadFilesDialogComponent | UploadTextComponent> {
    switch (type) {
      case 'folder':
      case 'files':
        return this.uploadFiles(type === 'folder');
      case 'link':
        return this.uploadLink();
      case 'csv':
        return this.uploadCsv();
    }
  }

  private uploadLink(): MatDialogRef<CreateLinkComponent> {
    return this.dialog.open(CreateLinkComponent);
  }

  private uploadFiles(folderMode = false): MatDialogRef<UploadFilesDialogComponent> {
    return this.dialog.open(UploadFilesDialogComponent, {
      data: { folderMode: folderMode },
    });
  }

  private uploadCsv(): MatDialogRef<UploadTextComponent> {
    return this.dialog.open(UploadTextComponent);
  }
}
