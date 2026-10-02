import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { CloudFolderComponent } from '@nuclia/sync';
import { ExternalConnection } from '@nuclia/core';

export interface ShareFileFolderSelection {
  folder_id?: string;
  sync_root_path?: string;
  drive_id: string;
}

@Component({
  selector: 'app-sharefile-folder-modal',
  imports: [CloudFolderComponent, PaButtonModule, PaModalModule, TranslateModule],
  templateUrl: './sharefile-folder-modal.component.html',
  styleUrl: './sharefile-folder-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareFileFolderModalComponent {
  modal = inject(ModalRef<{ externalConnection: ExternalConnection }, ShareFileFolderSelection>);

  externalConnection = this.modal.config.data?.externalConnection;
  selection?: ShareFileFolderSelection;

  onSelection(selection: ShareFileFolderSelection) {
    this.selection = selection;
  }

  confirm() {
    if (this.selection) {
      this.modal.close(this.selection);
    }
  }
}
