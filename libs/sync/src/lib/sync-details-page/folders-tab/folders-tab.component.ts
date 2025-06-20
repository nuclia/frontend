import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';

import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FolderListComponent, StickyFooterComponent } from '@nuclia/sistema';
import { Subject } from 'rxjs';
import { FolderSelectionComponent } from '../../folder-selection';
import { ISyncEntity, SyncItem } from '../../logic';

@Component({
  selector: 'nsy-folders-tab',
  imports: [
    FolderSelectionComponent,
    PaTextFieldModule,
    PaButtonModule,
    TranslateModule,
    PaIconModule,
    FolderListComponent,
    StickyFooterComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './folders-tab.component.html',
  styleUrl: './folders-tab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoldersTabComponent {
  private cdr = inject(ChangeDetectorRef);

  private _unsubscribeAll = new Subject<void>();

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
    const selection = this.selection.map((item) => item.metadata['displayPath'] || item.metadata['path']) || [];
    const query = this.query ? this.query.toLocaleLowerCase() : '';
    return query ? selection.filter((item) => item.toLocaleLowerCase().includes(query)) : selection;
  }
  editing = false;
  selection: SyncItem[] = [];
  selectionCount = 0;

  queryControl = new FormControl<string>('');

  get query() {
    return this.queryControl.value;
  }

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
