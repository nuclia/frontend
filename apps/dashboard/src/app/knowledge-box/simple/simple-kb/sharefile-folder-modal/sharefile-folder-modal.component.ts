import { ChangeDetectionStrategy, Component } from '@angular/core';
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

/**
 * Thin modal wrapper around the existing, proven `CloudFolderComponent` (the same
 * lazy-loading, breadcrumb-navigation folder browser used by every other cloud
 * connector in the full Sync feature). No changes to `CloudFolderComponent` itself —
 * this just hosts it inside a modal for the Content Box ShareFile entry point.
 */
@Component({
  selector: 'app-sharefile-folder-modal',
  imports: [CloudFolderComponent, PaButtonModule, PaModalModule, TranslateModule],
  templateUrl: './sharefile-folder-modal.component.html',
  styleUrl: './sharefile-folder-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareFileFolderModalComponent {
  externalConnection?: ExternalConnection;
  selection?: ShareFileFolderSelection;

  constructor(public modal: ModalRef<{ externalConnection: ExternalConnection }, ShareFileFolderSelection>) {
    this.externalConnection = this.modal.config.data?.externalConnection;
  }

  onSelection(selection: ShareFileFolderSelection) {
    this.selection = selection;
  }

  confirm() {
    if (this.selection) {
      this.modal.close(this.selection);
    }
  }
}
