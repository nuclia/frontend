import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FolderListComponent,
  FolderTree,
  FolderTreeComponent,
  SegmentedButtonsComponent,
  SisProgressModule,
  SisToastService,
} from '@nuclia/sistema';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, map, of, scan, tap } from 'rxjs';
import { ISyncEntity, SyncItem, SyncService } from '../logic';

@Component({
  selector: 'nsy-folder-selection',
  standalone: true,
  imports: [
    CommonModule,
    FolderListComponent,
    FolderTreeComponent,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    SegmentedButtonsComponent,
    SisProgressModule,
    TranslateModule,
  ],
  templateUrl: './folder-selection.component.html',
  styleUrl: './folder-selection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderSelectionComponent implements OnInit {
  private syncService = inject(SyncService);
  private toaster = inject(SisToastService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) sync!: ISyncEntity;

  @Output() selectedSyncItems = new EventEmitter<SyncItem[]>();

  searchQuery = new FormControl('', { nonNullable: true });
  folders?: FolderTree;
  totalFolders = 0;
  selectionCount = 0;
  loading = false;

  seeAll = true;
  selection: { id: string; path: string }[] = [];
  selectedPaths: string[] = [];

  private syncItems: SyncItem[] = [];
  private selectedIds: string[] = [];

  ngOnInit(): void {
    // We update selection before loading folders, so the selection can be applied to folders loaded
    this.updateSelection(
      (this.sync.foldersToSync || []).map((folder) => ({
        id: folder.uuid,
        path: folder.metadata['path'],
      })),
    );
    this.loadFolders();
  }

  updateView(newView: string) {
    this.seeAll = newView === 'left';
  }

  updateSelection(selection: { id: string; path: string }[]) {
    this.selection = selection;
    this.selectedPaths = selection.map((item) => item.path);
    this.selectedIds = selection.map((item) => item.id);
    this.selectionCount = selection.length;
    this.selectedSyncItems.emit(this.syncItems.filter((item) => this.selectedIds.includes(item.uuid)));
    this.cdr.markForCheck();
  }

  loadFolders($event?: { value: string }) {
    this.loading = true;
    this.syncService
      .getFolders($event?.value || '')
      .pipe(
        catchError((error) => {
          if (error) {
            this.toaster.error(
              typeof error === 'string'
                ? error
                : error.error?.message || error.error || error.message || 'An error occurred',
            );
          }

          return of({ items: [], nextPage: undefined });
        }),
        scan((acc, current) => acc.concat(current.items), [] as SyncItem[]),
        map((items) => items.sort((a, b) => a.metadata['path'].localeCompare(b.metadata['path']))),
        tap((items) => {
          this.totalFolders = items.length;
          this.syncItems = items;
        }),
        map((items) => this.getFolderTreeFromSyncItems(items)),
      )
      .subscribe({
        next: (tree: FolderTree) => {
          this.loading = false;
          this.folders = tree;
          this.cdr.markForCheck();
        },
      });
  }

  private getFolderTreeFromSyncItems(items: SyncItem[]): FolderTree {
    const tree: FolderTree = {
      id: 'root',
      path: '/',
      title: '/',
      expanded: true,
      children: {},
    };
    items.forEach((item) => {
      const path = item.metadata['path'];
      const id = item.originalId;
      const node: FolderTree = {
        id,
        title: item.title,
        path,
        displayPath: item.metadata['displayPath'] || path,
        children: {},
      };
      if (path === '/') {
        tree.children![id] = node;
      } else {
        let parent = tree;
        let folder: FolderTree | undefined;
        const parentIds = path.split('/').slice(1, -1);
        parentIds.forEach((parentId) => {
          if (parent) {
            folder = parent.children?.[parentId];
            if (folder) {
              parent = folder;
            }
          }
        });

        if (!parent.children) {
          parent.children = { [id]: node };
        } else {
          parent.children[id] = node;
        }
      }
    });
    return tree;
  }
}
