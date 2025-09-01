import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';

import { ModalRef, PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IntroComponent } from './intro/intro.component';
import { UploadComponent } from './upload/upload.component';
import { ProcessingComponent } from './processing/processing.component';
import { ItemToUpload } from './getting-started.models';
import { UploadService } from '@flaps/common';
import {
  combineLatest,
  filter,
  forkJoin,
  map,
  Observable,
  of,
  repeat,
  Subject,
  switchMap,
  take,
  tap,
  timer,
} from 'rxjs';
import { ExtractedDataTypes, Resource, RESOURCE_STATUS, ResourceProperties, Search, UploadStatus } from '@nuclia/core';
import { NavigationService, SDKService } from '@flaps/core';
import { catchError, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { GETTING_STARTED_DONE_KEY } from '@nuclia/user';

const POLLING_DELAY = 30000; // in milliseconds, so 30s

@Component({
  selector: 'app-getting-started',
  imports: [
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
  kbUrl = combineLatest([this.sdk.currentAccount, this.sdk.currentKb]).pipe(
    map(([account, kb]) => {
      const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
      return this.navigationService.getKbUrl(account.slug, kbSlug);
    }),
  );

  constructor(
    public modal: ModalRef,
    private uploadService: UploadService,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
    private router: Router,
    private navigationService: NavigationService,
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
        this.step = 'search';
        break;
      case 'search':
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
        filter((confirmed) => confirmed),
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
          return this.sdk.currentKb.pipe(
            take(1),
            switchMap((kb) =>
              this.uploadService.getResourceStatusCount(true).pipe(
                // repeat until allProcessed but with a step-back increasing by 3s at every step but maxing out at POLLING_DELAY
                repeat({ delay: (count) => timer(Math.min(POLLING_DELAY, count * 3000)) }),
                takeUntil(this.allProcessed),
                switchMap((results) =>
                  kb.processingStatus().pipe(map((processingStatus) => ({ processingStatus, results }))),
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
                      const status = processingStatus.results.find((result) => result.resource_id === iResource.id);
                      const resource = new Resource(this.sdk.nuclia, kb.id, iResource);
                      item.processed = resource.metadata?.status === RESOURCE_STATUS.PROCESSED;
                      if (!item.processed && status) {
                        item.processing = status.schedule_order === -1;
                        item.estimation = status.schedule_eta === -1 ? 60 : status.schedule_eta;
                        item.rank = status.schedule_order;
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
                    const estimatedMin =
                      this.itemsToUpload.reduce((total, item) => {
                        total += !item.processed ? item.estimation || 0 : 0;
                        return total;
                      }, 0) / 60;
                    this.totalEstimatedTime = Math.ceil(estimatedMin);
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
    return this.sdk.currentKb.pipe(
      take(1),
      switchMap((kb) =>
        forkJoin(
          linkList.map((item) =>
            this.uploadService.createLinkResource(kb, item.link as string, []).pipe(
              map((response) => {
                item.uploaded = true;
                item.uuid = response.uuid;
                return item;
              }),
            ),
          ),
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
