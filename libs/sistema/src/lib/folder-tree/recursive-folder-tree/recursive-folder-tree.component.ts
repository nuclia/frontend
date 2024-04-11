import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FolderTree } from '../folder-tree.model';
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
  readonly folderIcon = 'assets/icons/folder.svg';

  @Input({ required: true }) folderTree: FolderTree | null = null;

  toggleFolder(folder: FolderTree, selected: boolean) {
    this.state.toggleFolder(folder, selected);
  }
}
