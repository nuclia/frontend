import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  imports: [CommonModule, PaButtonModule, PaModalModule, TranslateModule],
  template: `
    <pa-modal-advanced
      fitContentHeight
      fitContent>
      <pa-modal-title>{{ modal.config.data?.title }}</pa-modal-title>
      <pa-modal-content>
        @if (modal.config.data?.json) {
          <pre>{{ modal.config.data?.value | json }}</pre>
        } @else {
          <p>{{ modal.config.data?.value }}</p>
        }
      </pa-modal-content>
      <pa-modal-footer>
        <pa-button
          aspect="basic"
          (click)="modal.close()">
          {{ 'generic.close' | translate }}
        </pa-button>
      </pa-modal-footer>
    </pa-modal-advanced>
  `,
  styleUrls: ['./log-table-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTableModalComponent {
  constructor(public modal: ModalRef<{ title: string; value: string; json: boolean }>) {}
}
