import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaIconModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { IKnowledgeBoxItem } from '@nuclia/core';
import { map } from 'rxjs/operators';

@Component({
  imports: [CommonModule, PaModalModule, PaButtonModule, PaIconModule, TranslateModule],
  templateUrl: './rao-kb-selection-modal.component.html',
  styleUrl: './rao-kb-selection-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RaoKbSelectionModalComponent implements OnInit {
  private sdk = inject(SDKService);

  selectedKbId = signal<string | null>(null);

  kbs = this.sdk.kbList.pipe(map((kbs) => (kbs || []).filter((kb) => !!kb.id && !!kb.role_on_kb)));

  constructor(public modal: ModalRef) {}

  ngOnInit() {
    this.sdk.refreshKbList();
  }

  selectKb(kbId: string) {
    this.selectedKbId.set(kbId);
  }

  continue() {
    const kbId = this.selectedKbId();
    if (kbId) {
      this.modal.close(kbId);
    }
  }

  trackByKbId(_: number, kb: IKnowledgeBoxItem): string {
    return kb.id;
  }
}
