import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { combineLatest, filter, map, Observable, switchMap, take } from 'rxjs';
import { SimpleKBService } from '../simple-kb.service';
import { Resource, RESOURCE_STATUS } from '@nuclia/core';
import { getResourceErrors } from '@flaps/common';
import { SDKService } from '@flaps/core';
import { addMinutes } from 'date-fns';
import { SisIconsModule, SisModalService } from '@nuclia/sistema';

interface TableRow {
  id?: string;
  title?: string;
  extension?: string;
  icon?: string;
  created?: string;
  status?: RESOURCE_STATUS | 'uploading';
  rank?: number;
  errorMessage?: string;
}

@Component({
  selector: 'app-resource-table',
  templateUrl: './resource-table.component.html',
  styleUrl: './resource-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, PaButtonModule, PaIconModule, PaTableModule, SisIconsModule, TranslateModule],
})
export class ResourceTableComponent {
  simpleKBService = inject(SimpleKBService);
  sdk = inject(SDKService);
  modalService = inject(SisModalService);

  columns = ['file', 'type', 'status', 'date-added', 'delete'];
  RESOURCE_STATUS = RESOURCE_STATUS;

  rows: Observable<TableRow[]> = combineLatest([
    this.simpleKBService.resources,
    this.simpleKBService.visibleUploads,
  ]).pipe(
    map(([resources, uploads]) => [
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
      })),
      ...uploads.map((upload) => ({
        title: this.splitTitle(upload.file.name || '').name,
        extension: this.splitTitle(upload.file.name || '').extension,
        icon: upload.file.type,
        created: addMinutes(new Date(), 5).toISOString(), // Display uploads at the top of the list
        status: (this.simpleKBService.isUploadFailed(upload)
          ? RESOURCE_STATUS.ERROR
          : 'uploading') as TableRow['status'],
        errorMessage: this.simpleKBService.isUploadFailed(upload) ? 'simple.upload-error' : '',
      })),
    ]),
    map((rows) => rows.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())),
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
        this.simpleKBService.forceRefresh();
      });
  }

  splitTitle(title: string): { name: string; extension: string } {
    const parts = title.split('.');
    if (parts.length > 1) {
      return { name: parts.slice(0, -1).join('.'), extension: parts[parts.length - 1] };
    } else {
      return { name: title, extension: '' };
    }
  }
}
