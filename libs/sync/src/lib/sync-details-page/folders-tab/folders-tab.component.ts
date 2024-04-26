import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ISyncEntity, SyncItem, SyncService } from '../../logic';
import { FolderSelectionComponent } from '../../folder-selection';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FolderListComponent, InfoCardComponent, StickyFooterComponent } from '@nuclia/sistema';

@Component({
  selector: 'nsy-folders-tab',
  standalone: true,
  imports: [
    CommonModule,
    FolderSelectionComponent,
    PaTextFieldModule,
    PaButtonModule,
    TranslateModule,
    PaIconModule,
    InfoCardComponent,
    FolderListComponent,
    StickyFooterComponent,
  ],
  templateUrl: './folders-tab.component.html',
  styleUrl: './folders-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoldersTabComponent {
  private syncService = inject(SyncService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) set sync(value: ISyncEntity) {
    this._sync = value;
    this.updateSelection(value.foldersToSync || []);
  }
  get sync(): ISyncEntity | undefined {
    return this._sync;
  }
  private _sync?: ISyncEntity;

  @Output() syncChange = new EventEmitter<ISyncEntity>();

  get selectedFolders() {
    return this.selection.map((item) => item.metadata['path']) || [];
  }
  editing = false;
  saving = false;
  selection: SyncItem[] = [];
  selectionCount = 0;

  updateSelection(selection: SyncItem[]) {
    this.selection = selection;
    this.selectionCount = this.selection.length;
    this.cdr.detectChanges();
  }

  saveSelection() {
    if (!this.sync) {
      return;
    }
    this.saving = true;
    const sync = this.sync;
    const selection = this.selection;
    this.syncService.updateSync(sync.id, { foldersToSync: selection }, true).subscribe(() => {
      this.editing = false;
      this.saving = false;
      this.sync = { ...sync, foldersToSync: selection };
      this.syncChange.emit(this.sync);
      this.cdr.detectChanges();
    });
  }
}
