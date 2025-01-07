import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FOLDER_ICON_PATH } from '../folder-tree';
import { InfoCardComponent } from '../cards';
import { TranslateModule } from '@ngx-translate/core';
import { PaIconModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'nsi-folder-list',
  imports: [CommonModule, InfoCardComponent, TranslateModule, PaIconModule],
  templateUrl: './folder-list.component.html',
  styleUrl: './folder-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderListComponent {
  protected readonly folderIcon = FOLDER_ICON_PATH;

  @Input({ required: true }) folders: string[] = [];
  @Input({ transform: booleanAttribute }) filtered = false;
}
