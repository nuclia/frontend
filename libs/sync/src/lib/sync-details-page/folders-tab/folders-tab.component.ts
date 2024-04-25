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
import { FolderListComponent, InfoCardComponent } from '@nuclia/sistema';

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
  ],
  templateUrl: './folders-tab.component.html',
  styleUrl: './folders-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoldersTabComponent {
  private syncService = inject(SyncService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) sync!: ISyncEntity;

  @Output() syncChange = new EventEmitter<ISyncEntity>();

  get selectedFolders() {
    return this.sync ? this.sync.foldersToSync?.map((item) => item.metadata['path']) || [] : [];
  }
  editing = false;
  saving = false;

  saveSelection(selection: SyncItem[]) {
    this.saving = true;
    this.syncService.updateSync(this.sync.id, { foldersToSync: selection }, true).subscribe(() => {
      this.editing = false;
      this.saving = false;
      this.sync = { ...this.sync, foldersToSync: selection };
      this.syncChange.emit(this.sync);
      this.cdr.detectChanges();
    });
  }
}
