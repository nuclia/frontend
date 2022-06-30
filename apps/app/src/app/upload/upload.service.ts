import { Injectable } from '@angular/core';
import { SDKService, md5 } from '@flaps/auth';
import { FileWithMetadata, ICreateResource, UploadStatus } from '@nuclia/core';
import { forkJoin, startWith, Subject, BehaviorSubject, switchMap, tap, take } from 'rxjs';

export const FILES_TO_IGNORE = ['.DS_Store', 'Thumbs.db'];

@Injectable({ providedIn: 'root' })
export class UploadService {
  private _progress = new Subject<UploadStatus>();
  progress = this._progress.asObservable();

  private _barDisabled = new BehaviorSubject<boolean>(false);
  barDisabled = this._barDisabled.asObservable();

  constructor(private sdk: SDKService) {}

  uploadFiles(files: FileWithMetadata[], createPayload?: ICreateResource) {
    forkJoin(files.map((file) => md5(file)))
      .pipe(
        switchMap((filelist) =>
          this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) => kb.batchUpload(filelist, createPayload)),
          ),
        ),
        startWith({ files: [], progress: 0, completed: false, uploaded: 0, failed: 0, conflicts: 0 }),
        tap((progress) => {
          if (progress.completed) {
            this.sdk.refreshCounter();
          }
        }),
      )
      .subscribe((progress) => {
        this._progress.next(progress);
      });
    this._barDisabled.next(false);
  }

  disableBar() {
    this._barDisabled.next(true);
  }
}
