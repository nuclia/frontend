import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FolderTree, FolderTreeUI } from './folder-tree.model';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { RecursiveFolderTreeComponent } from './recursive-folder-tree/recursive-folder-tree.component';
import { FolderTreeState } from './folder-tree.state';
import { map, Observable, tap } from 'rxjs';

@Component({
  selector: 'nsi-folder-tree',
  standalone: true,
  imports: [CommonModule, PaTogglesModule, PaIconModule, PaButtonModule, RecursiveFolderTreeComponent],
  templateUrl: './folder-tree.component.html',
  styleUrl: './folder-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FolderTreeState],
})
export class FolderTreeComponent {
  private state = inject(FolderTreeState);

  @Input({ required: true }) set folderTree(value: FolderTree) {
    this.state.initTree(value);
  }

  @Output() selection = new EventEmitter<string[]>();

  tree: Observable<FolderTreeUI> = this.state.tree.pipe(
    tap((value) => {
      const selection: string[] = [];
      this.getSelection(value, selection);
      this.selection.emit(selection);
    }),
    map((tree) => this.mapToFolderTreeUI(tree)),
  );

  /**
   * Update the selection recursively
   * @param folder
   * @param selection
   * @private
   */
  private getSelection(folder: FolderTree, selection: string[]) {
    if (folder.selected) {
      selection.push(folder.id);
    } else if (folder.children && Object.values(folder.children).length > 0) {
      Object.values(folder.children).forEach((child: FolderTree) => {
        this.getSelection(child, selection);
      });
    }
  }

  private mapToFolderTreeUI(folder: FolderTree): FolderTreeUI {
    return {
      ...folder,
      height: this.getChildrenHeight(folder),
      children: Object.values(folder.children || {}).reduce((childrenWithHeight, child) => {
        return {
          ...childrenWithHeight,
          [child.path]: this.mapToFolderTreeUI(child),
        };
      }, {}),
    };
  }

  private getChildrenHeight(folder: FolderTree): number {
    const childList = Object.values(folder.children || {});
    if (!folder.expanded || childList.length === 0) {
      return 0;
    } else {
      return 40 * childList.length + childList.reduce((count, item) => count + this.getChildrenHeight(item), 0);
    }
  }
}
