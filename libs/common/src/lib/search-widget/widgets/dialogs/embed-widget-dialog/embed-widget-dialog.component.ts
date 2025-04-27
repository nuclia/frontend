import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-embed-widget-dialog',
  imports: [CommonModule, InfoCardComponent, PaButtonModule, PaModalModule, PaTogglesModule, TranslateModule],
  templateUrl: './embed-widget-dialog.component.html',
  styleUrl: './embed-widget-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmbedWidgetDialogComponent {
  synchronize = false;
  snippet = this.modal.config?.data?.code.snippet;
  synchSnippet = this.modal.config?.data?.code.synchSnippet;

  constructor(public modal: ModalRef<{ code: { snippet: string; synchSnippet?: string } }>) {}

  copyAndClose() {
    navigator.clipboard.writeText(this.synchronize ? this.synchSnippet || '' : this.snippet || '');
    this.modal.close();
  }
}
