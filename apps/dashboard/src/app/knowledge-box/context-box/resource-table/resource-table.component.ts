import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TablePaginationComponent } from '@flaps/common';
import { getResourceErrors, SDKService } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTableModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { Resource, RESOURCE_STATUS } from '@nuclia/core';
import {
  NsiSkeletonComponent,
  SisModalService,
  SisSearchInputComponent,
  StandaloneMimeIconPipe,
  StickyFooterComponent,
} from '@nuclia/sistema';
import { addMinutes } from 'date-fns';
import { combineLatest, filter, map, switchMap, take } from 'rxjs';
import { ContextBoxShareFileService } from '../context-box/context-box-sharefile.service';
import { ContextBoxService, PAGE_SIZES } from '../context-box/context-box.service';
import { ResourceTableService } from './resource-table.service';

interface TableRow {
  id?: string;
  title?: string;
  extension?: string;
  icon?: string;
  created?: string;
  status?: RESOURCE_STATUS | 'uploading';
  rank?: number;
  errorMessage?: string;
  sourceConnector?: 'sharefile';
}

@Component({
  selector: 'app-resource-table',
  templateUrl: './resource-table.component.html',
  styleUrl: './resource-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResourceTableService],
  imports: [
    PaTableModule,
    PaTooltipModule,
    PaIconModule,
    PaButtonModule,
    NsiSkeletonComponent,
    DatePipe,
    TranslatePipe,
    StandaloneMimeIconPipe,
    TablePaginationComponent,
    StickyFooterComponent,
    SisSearchInputComponent,
  ],
})
export class ResourceTableComponent {
  contextBoxService = inject(ContextBoxService);
  shareFileService = inject(ContextBoxShareFileService);
  resourceTableService = inject(ResourceTableService);
  sdk = inject(SDKService);
  modalService = inject(SisModalService);

  columns = ['file', 'type', 'status', 'date-added', 'delete'];
  RESOURCE_STATUS = RESOURCE_STATUS;
  pageSizes = PAGE_SIZES;

  skeletonRows = computed(() => new Array(this.resourceTableService.pageSize()));

  rows = toSignal(
    combineLatest([
      this.resourceTableService.resources,
      this.contextBoxService.visibleUploads,
      toObservable(this.shareFileService.connectedSource),
      toObservable(this.resourceTableService.page),
    ]).pipe(
      map(([resources, uploads, connectedSource, page]): TableRow[] => [
        ...resources.map((resource) => ({
          id: resource.id,
          title: this.splitTitle(resource.title || '').name,
          extension: this.splitTitle(resource.title || '').extension,
          icon: resource.icon,
          created: resource.created + 'Z',
          status: resource.metadata?.status,
          rank: resource.rank,
          errorMessage:
            resource.metadata?.status === RESOURCE_STATUS.ERROR
              ? getResourceErrors(new Resource(this.sdk.nuclia, resource.id, resource))
              : '',
          sourceConnector: (connectedSource && resource.origin?.source_id === connectedSource.id
            ? 'sharefile'
            : undefined) as TableRow['sourceConnector'],
        })),
        // In-progress uploads are only overlaid on the first page; once indexed, they show up
        // in their normal position (and page) via the regular resources catalog.
        ...(page === 0
          ? uploads.map((upload) => ({
              title: this.splitTitle(upload.file.name || '').name,
              extension: this.splitTitle(upload.file.name || '').extension,
              icon: upload.file.type,
              created: addMinutes(new Date(), 5).toISOString(), // Display uploads at the top of the list
              status: (this.resourceTableService.isUploadFailed(upload)
                ? RESOURCE_STATUS.ERROR
                : 'uploading') as TableRow['status'],
              errorMessage: this.resourceTableService.isUploadFailed(upload) ? 'context-box.upload-error' : '',
            }))
          : []),
      ]),
      map((rows) => rows.sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())),
    ),
    { initialValue: [] as TableRow[] },
  );

  deleteResource(id: string) {
    this.modalService
      .openConfirm({
        title: 'resource.confirm-delete.title',
        description: 'resource.confirm-delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => result),
        switchMap(() => this.sdk.currentKb.pipe(take(1))),
        switchMap((kb) => new Resource(this.sdk.nuclia, kb.id, { id }).delete()),
      )
      .subscribe(() => {
        this.contextBoxService.forceRefresh();
      });
  }

  splitTitle(title: string): { name: string; extension: string } {
    const parts = title.split('.');
    if (parts.length > 1) {
      return { name: parts.slice(0, -1).join('.'), extension: parts.at(-1)! };
    } else {
      return { name: title, extension: '' };
    }
  }
}
