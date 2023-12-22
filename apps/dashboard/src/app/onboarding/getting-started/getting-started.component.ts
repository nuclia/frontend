import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IntroComponent } from './intro/intro.component';
import { UploadComponent } from './upload/upload.component';
import { ProcessingComponent } from './processing/processing.component';
import { ItemToUpload } from './getting-started.models';
import { NavigationService, UploadService } from '@flaps/common';
import { filter, forkJoin, map, Observable, of, repeat, Subject, switchMap, take, tap, timer } from 'rxjs';
import { ExtractedDataTypes, Resource, RESOURCE_STATUS, ResourceProperties, Search, UploadStatus } from '@nuclia/core';
import { PostHogService, SDKService } from '@flaps/core';
import { catchError, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';

const AVERAGE_PROCESSING_TIME = 5;
const POLLING_DELAY = 30000; // in milliseconds, so 30s

@Component({
  selector: 'app-getting-started',
  standalone: true,
  imports: [
    CommonModule,
    PaModalModule,
    TranslateModule,
    PaButtonModule,
    PaIconModule,
    IntroComponent,
    UploadComponent,
    ProcessingComponent,
  ],
  templateUrl: './getting-started.component.html',
  styleUrl: './getting-started.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GettingStartedComponent implements OnDestroy {
  step: 'intro' | 'upload' | 'processing' | 'search' = 'intro';
  nextDisabled = false;
  itemsToUpload: ItemToUpload[] = [];
  totalEstimatedTime = 0;

  unsubscribeAll = new Subject<void>();
  allProcessed = new Subject<void>();
  kbUrl = this.sdk.currentKb.pipe(
    map((kb) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.navigationService.getKbUrl(kb.account, kbSlug);
    }),
  );

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
    private postHog: PostHogService,
  ) {}

  ngOnDestroy() {
    this.allProcessed.next();
    this.allProcessed.complete();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  next() {
    switch (this.step) {
      case 'intro':
        this.step = 'upload';
        this.nextDisabled = true;
        break;
      case 'upload':
        this.uploadAndProcess();
        break;
      case 'processing':
        this.postHog.logEvent('getting_started_processing_done');
        this.step = 'search';
        break;
      case 'search':
        this.postHog.logEvent('getting_started_fully_done');
        forkJoin([this.kbUrl.pipe(take(1)), this.generateExampleQuestion().pipe(take(1))]).subscribe(
          ([url, question]) => {
            this.router.navigate([`${url}/search`], { queryParams: { __nuclia_query__: question } });
            this.modal.close();
            localStorage.setItem(GETTING_STARTED_DONE_KEY, 'true');
          },
        );
        break;
    }
  }

  onUploadReady(data: { ready: boolean; itemList: ItemToUpload[] }) {
    this.nextDisabled = !data.ready;
    this.itemsToUpload = data.itemList;
    this.cdr.markForCheck();
  }

  private uploadAndProcess() {
    const files: File[] = this.itemsToUpload.filter((item) => !!item.file).map((item) => item.file as File);
    this.uploadService
      .checkFileTypesAndConfirm(files)
      .pipe(
        filter((confirmed) => {
          if (!confirmed) {
            this.postHog.logEvent('getting_started_closed');
          }
          return confirmed;
        }),
        tap(() => {
          this.step = 'processing';
          this.nextDisabled = true;
          this.cdr.markForCheck();

          const counts = this.itemsToUpload.reduce(
            (counts, item) => {
              if (item.link) {
                counts.linkCount += 1;
              } else if (item.file) {
                counts.fileCount += 1;
              }
              return counts;
            },
            { fileCount: 0, linkCount: 0 },
          );
          this.postHog.logEvent('getting_started_upload', {
            fileCount: `${counts.fileCount}`,
            linkCount: `${counts.linkCount}`,
          });
        }),
        switchMap((): Observable<ItemToUpload[]> => {
          const linkList: ItemToUpload[] = this.itemsToUpload.filter((item) => !!item.link);
          return linkList.length > 0
            ? this.createLinkResources(linkList).pipe(
                map((linkItems: ItemToUpload[]) => {
                  // Update the links in the UI
                  this.itemsToUpload = this.itemsToUpload.map((item) => {
                    const linkItem = linkItems.find((linkItem) => linkItem.id === item.id);
                    return linkItem ? linkItem : item;
                  });
                  this.cdr.markForCheck();
                  return linkItems;
                }),
              )
            : of([]);
        }),
        switchMap((linkItems): Observable<ItemToUpload[]> => {
          const fileList = this.itemsToUpload.filter((item) => item.file).map((item) => item.file as File);
          return fileList.length > 0
            ? this.createFileResources(fileList).pipe(
                map((fileItems: ItemToUpload[]) => {
                  // Update the files in the UI
                  const itemsToUpload = linkItems.concat(fileItems);
                  this.itemsToUpload = itemsToUpload;
                  this.cdr.markForCheck();
                  return itemsToUpload;
                }),
              )
            : of(linkItems);
        }),
        switchMap((uploadedItems) => {
          return forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentKb.pipe(take(1))]).pipe(
            switchMap(([account, kb]) =>
              this.uploadService.getResourceStatusCount().pipe(
                // repeat until allProcessed but with a step-back increasing by 3s at every step but maxing out at POLLING_DELAY
                repeat({ delay: (count) => timer(Math.min(POLLING_DELAY, count * 3000)) }),
                takeUntil(this.allProcessed),
                switchMap((results) =>
                  this.sdk.nuclia.db
                    .getProcessingStatus(account.id)
                    .pipe(map((processingStatus) => ({ processingStatus, results }))),
                ),
                tap(({ processingStatus, results }) => {
                  const resources = results.resources || {};
                  const resourceList = Object.values(resources);
                  this.itemsToUpload = uploadedItems.map((item) => {
                    if (item.uploadFailed) {
                      return item;
                    }
                    const iResource = item.uuid
                      ? resources[item.uuid]
                      : resourceList.find((resource) => resource.title === item.title);
                    if (iResource) {
                      const resource = new Resource(this.sdk.nuclia, kb.id, iResource);
                      const placeInQueue = this.uploadService.getResourcePlaceInProcessingQueue(
                        resource,
                        processingStatus,
                      );
                      item.processed =
                        resource.metadata?.status === RESOURCE_STATUS.PROCESSED ||
                        (placeInQueue !== null && placeInQueue < 0);
                      if (!item.processed) {
                        item.processing = true;
                        item.estimation =
                          placeInQueue === null
                            ? AVERAGE_PROCESSING_TIME
                            : Math.max(placeInQueue * AVERAGE_PROCESSING_TIME, 0);
                      }
                    }
                    return item;
                  });

                  // if everything is processed or failed, we stop polling processing status and enable next button
                  if (this.itemsToUpload.every((item) => item.processed || item.uploadFailed)) {
                    this.allProcessed.next();
                    this.nextDisabled = false;
                    this.totalEstimatedTime = 0;
                  } else {
                    this.totalEstimatedTime = this.itemsToUpload.reduce((total, item) => {
                      total += !item.processed ? item.estimation || 0 : 0;
                      return total;
                    }, 0);
                  }
                  this.cdr.markForCheck();
                }),
              ),
            ),
          );
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  private createFileResources(fileList: File[]): Observable<ItemToUpload[]> {
    return this.uploadService.uploadFiles(fileList).pipe(
      map((uploadStatus: UploadStatus) => {
        return uploadStatus.files
          .map((fileStatus) => {
            const fileItem = this.itemsToUpload.find(
              (item) =>
                item.file &&
                item.file.name === fileStatus.file.name &&
                item.file.size === fileStatus.file.size &&
                item.file.type === fileStatus.file.type,
            );
            if (fileItem) {
              fileItem.uploaded = fileStatus.uploaded;
              fileItem.uploadProgress = fileStatus.progress;
              fileItem.uploadFailed = fileStatus.failed;
            }
            return fileItem;
          })
          .filter((item) => !!item) as ItemToUpload[];
      }),
    );
  }

  private createLinkResources(linkList: ItemToUpload[]): Observable<ItemToUpload[]> {
    return forkJoin(
      linkList.map((item) =>
        this.uploadService.createLinkResource(item.link as string, []).pipe(
          map((response) => {
            item.uploaded = true;
            item.uuid = response.uuid;
            return item;
          }),
        ),
      ),
    );
  }

  private generateExampleQuestion(): Observable<string> {
    return this.sdk.currentKb.pipe(
      switchMap((kb) =>
        kb.catalog('').pipe(
          map((results) => Object.keys((results as Search.Results)?.resources || {})),
          switchMap((ids) => {
            if (ids.length > 0) {
              return kb.getResource(ids[0], [ResourceProperties.EXTRACTED], [ExtractedDataTypes.METADATA]);
            } else {
              return of(null);
            }
          }),
          switchMap((resource) =>
            resource
              ? kb.generateRandomQuestionAboutResource(resource).pipe(
                  catchError((err) => {
                    console.error(err);
                    return of('');
                  }),
                )
              : of(''),
          ),
        ),
      ),
    );
  }
}
