import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '../cards';
import { FOLDER_ICON_PATH } from '../folder-tree';

@Component({
  selector: 'nsi-folder-list',
  imports: [InfoCardComponent, TranslatePipe, PaIconModule],
  templateUrl: './folder-list.component.html',
  styleUrl: './folder-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderListComponent {
  protected readonly folderIcon = FOLDER_ICON_PATH;

  @Input({ required: true }) folders: string[] = [];
  @Input({ transform: booleanAttribute }) filtered = false;
}
