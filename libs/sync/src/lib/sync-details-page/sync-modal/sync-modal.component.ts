import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  templateUrl: './sync-modal.component.html',
  styleUrls: ['./sync-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslateModule, PaButtonModule, PaModalModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncModalComponent {
  constructor(public modal: ModalRef<void, { sync: 'new' | 'all' }>) {}

  sync() {
    this.modal.close({ sync: 'new' });
  }
  resync() {
    this.modal.close({ sync: 'all' });
  }
}
