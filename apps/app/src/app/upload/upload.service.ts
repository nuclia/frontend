import { Injectable } from '@angular/core';
import { SDKService } from '@flaps/auth';
import { FileWithMetadata, ICreateResource, UploadStatus } from '@nuclia/core';
import { forkJoin, startWith, Subject, switchMap, tap } from 'rxjs';
import { md5 } from './md5';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private _progress = new Subject<UploadStatus>();
  progress = this._progress.asObservable();

  constructor(private sdk: SDKService) {}

  uploadFiles(files: FileWithMetadata[], createPayload?: ICreateResource) {
    forkJoin(files.map((file) => md5(file)))
      .pipe(
        switchMap((filelist) => this.sdk.currentKb.pipe(switchMap((kb) => kb.batchUpload(filelist, createPayload)))),
        startWith({ progress: 0, completed: false, uploaded: 0, failed: 0, conflicts: 0 }),
        tap((progress) => {
          if (progress.completed) {
            this.sdk.refreshCounter();
          }
        }),
      )
      .subscribe(this._progress);
  }
}
