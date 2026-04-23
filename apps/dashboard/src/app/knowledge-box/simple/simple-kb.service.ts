import { inject, Injectable } from '@angular/core';
import { searchResources, UploadService } from '@flaps/common';
import { NotificationService, SDKService } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadStatus, IResource, RESOURCE_STATUS, SortField, UploadStatus } from '@nuclia/core';
import { SisToastService } from '@nuclia/sistema';
import {
  BehaviorSubject,
  combineLatest,
  map,
  merge,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  throttleTime,
} from 'rxjs';

type rankedResource = IResource & { rank?: number };

@Injectable({
  providedIn: 'root',
})
export class SimpleKBService {
  private sdk = inject(SDKService);
  private uploadService = inject(UploadService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);
  private notificationService = inject(NotificationService);

  maxFiles = 200;

  uploadStatus = new BehaviorSubject<UploadStatus>({
    files: [],
    progress: 0,
    completed: false,
    uploaded: 0,
    failed: 0,
  });

  visibleUploads = this.uploadStatus.pipe(map((uploads) => uploads.files.filter((upload) => !upload.uploaded)));
  uploadInProgress = this.visibleUploads.pipe(
    map((uploads) => uploads.filter((upload) => !this.isUploadFailed(upload)).length > 0),
  );

  forceRefresh = new Subject<void>();
  refreshResources = merge(
    merge(this.notificationService.hasNewResourceOperationNotifications, this.uploadStatus, this.forceRefresh).pipe(
      throttleTime(300, undefined, { leading: true, trailing: true }),
    ),
  );

  resources: Observable<rankedResource[]> = combineLatest([this.sdk.currentKb, this.refreshResources]).pipe(
    switchMap(([kb]) =>
      searchResources(kb, {
        page: 0,
        pageSize: this.maxFiles,
        sort: { field: SortField.title, order: 'desc' },
        query: '',
        filters: [],
      }),
    ),
    map((data) => Object.values(data.results.resources || {})),
    switchMap((resources) => {
      if (resources.some((resource) => resource.metadata?.status === RESOURCE_STATUS.PENDING)) {
        return this.getResourcesWithRank(resources);
      } else {
        return of(resources);
      }
    }),
    shareReplay({ refCount: true, bufferSize: 1 }),
  );

  resourceCounter = this.resources.pipe(
    map((resources) => ({
      pending: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.PENDING).length,
      error: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.ERROR).length,
      processed: resources.filter((res) => res.metadata?.status === RESOURCE_STATUS.PROCESSED).length,
    })),
  );

  refresh() {
    this.forceRefresh.next();
  }

  uploadFiles(files: File[]) {
    this.resources.pipe(take(1)).subscribe((resources) => {
      if (resources.length + files.length > this.maxFiles) {
        this.toaster.error(this.translate.instant('simple.file-limit', { num: this.maxFiles }));
        return;
      }
      this.uploadService
        .uploadFiles(files, (status) => {
          this.uploadStatus.next(status);
          this.forceRefresh.next();
        })
        .subscribe((status) => {
          this.uploadStatus.next(status);
        });
    });
  }

  isUploadFailed(upload: FileUploadStatus): boolean {
    return upload.failed || !!upload.blocked || !!upload.conflicts || !!upload.limitExceeded;
  }

  getResourcesWithRank(resources: IResource[]): Observable<rankedResource[]> {
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) => kb.processingStatus(undefined, undefined, this.maxFiles)),
      map((processingStatus) =>
        processingStatus.results
          .filter((status) => status.schedule_order !== -1)
          .reduce((resources, status) => {
            const index = resources.findIndex((resource) => resource.id === status.resource_id);
            if (index > -1) {
              resources[index] = { ...resources[index], rank: status.schedule_order };
            }
            return resources;
          }, resources as rankedResource[])
          .sort((a, b) => (a.rank && b.rank ? a.rank - b.rank : 0)),
      ),
    );
  }
}
