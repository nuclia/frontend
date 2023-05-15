import { Injectable } from '@angular/core';
import { CreateLinkComponent, UploadFilesDialogComponent, UploadTextComponent } from '@flaps/common';
import { SisModalService } from '@nuclia/sistema';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';

export type UploadType = 'files' | 'folder' | 'link' | 'csv';

@Injectable({
  providedIn: 'root',
})
export class UploadDialogService {
  constructor(private modal: SisModalService) {}

  upload(type: UploadType): ModalRef {
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

  private uploadLink(): ModalRef {
    return this.modal.openModal(CreateLinkComponent);
  }

  private uploadFiles(folderMode = false): ModalRef {
    return this.modal.openModal(UploadFilesDialogComponent, {
      dismissable: true,
      data: { folderMode: folderMode },
    });
  }

  private uploadCsv(): ModalRef {
    return this.modal.openModal(UploadTextComponent);
  }
}
