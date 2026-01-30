import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SDKService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';

@Component({
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, TranslateModule],
  templateUrl: './endpoint-modal.component.html',
  styleUrl: './endpoint-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndpointModalComponent {
  sdk = inject(SDKService);
  modal = inject(ModalRef);

  endpoint = this.sdk.currentArag.pipe(map((arag) => arag.fullpath));
  copied = signal(false);

  copy(endpoint: string) {
    navigator.clipboard.writeText(endpoint);
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 1000);
  }
}
