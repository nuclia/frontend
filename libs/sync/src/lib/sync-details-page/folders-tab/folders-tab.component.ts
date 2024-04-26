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
import { ISyncEntity, SyncItem } from '../../logic';
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
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) set sync(value: ISyncEntity) {
    this._sync = value;
    this.updateSelection(value.foldersToSync || []);
  }
  get sync(): ISyncEntity | undefined {
    return this._sync;
  }
  private _sync?: ISyncEntity;

  @Output() selectionChange = new EventEmitter<SyncItem[]>();

  get selectedFolders() {
    return this.selection.map((item) => item.metadata['path']) || [];
  }
  editing = false;
  selection: SyncItem[] = [];
  selectionCount = 0;

  updateSelection(selection: SyncItem[]) {
    this.selection = selection;
    this.selectionCount = this.selection.length;
    this.cdr.detectChanges();
  }

  saveSelection() {
    this.selectionChange.emit(this.selection);
    this.editing = false;
    this.cdr.markForCheck();
  }
}
