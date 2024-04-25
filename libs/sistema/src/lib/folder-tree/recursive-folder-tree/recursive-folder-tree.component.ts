import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FOLDER_ICON_PATH, FolderTree, FolderTreeUI } from '../folder-tree.model';
import { FolderTreeState } from '../folder-tree.state';

@Component({
  selector: 'nsi-recursive-folder-tree',
  standalone: true,
  imports: [CommonModule, PaTogglesModule, PaButtonModule, PaIconModule],
  templateUrl: './recursive-folder-tree.component.html',
  styleUrl: './recursive-folder-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecursiveFolderTreeComponent {
  private state = inject(FolderTreeState);
  readonly folderIcon = FOLDER_ICON_PATH;

  @Input({ required: true }) folderTree: FolderTreeUI | null = null;

  toggleFolder(folder: FolderTree, selected: boolean) {
    console.log(`toggleFolder`);
    this.state.toggleFolder(folder, selected);
  }

  toggleExpand(folder: FolderTreeUI) {
    this.state.updateExpanded(folder);
  }
}
