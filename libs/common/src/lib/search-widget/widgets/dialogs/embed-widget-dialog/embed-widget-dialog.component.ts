import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'stf-embed-widget-dialog',
  imports: [CommonModule, PaModalModule, TranslateModule, PaButtonModule],
  templateUrl: './embed-widget-dialog.component.html',
  styleUrl: './embed-widget-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedWidgetDialogComponent {
  constructor(public modal: ModalRef<{ code: string }>) {}

  copyAndClose() {
    navigator.clipboard.writeText(this.modal.config?.data?.code || '');
    this.modal.close();
  }
}
