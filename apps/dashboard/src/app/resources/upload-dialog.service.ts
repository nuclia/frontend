import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreateLinkComponent } from '../upload/create-link/create-link.component';
import { UploadFilesDialogComponent } from '../upload/upload-files/upload-files-dialog.component';
import { UploadTextComponent } from '../upload/upload-text/upload-text.component';

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
