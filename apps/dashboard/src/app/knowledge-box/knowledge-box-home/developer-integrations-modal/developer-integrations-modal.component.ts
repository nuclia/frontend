import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService, ZoneService } from '@flaps/core';
import { map, switchMap } from 'rxjs';

type CopyField = 'endpoint' | 'mcp' | 'uid';

@Component({
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, TranslateModule],
  templateUrl: './developer-integrations-modal.component.html',
  styleUrl: './developer-integrations-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeveloperIntegrationsModalComponent {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);

  protected modal = inject(ModalRef);
  protected copiedField = signal<CopyField | null>(null);

  protected endpoint = toSignal(this.sdk.currentKb.pipe(map((kb) => kb.fullpath)), { initialValue: '' });
  protected uid = toSignal(this.sdk.currentKb.pipe(map((kb) => kb.id)), { initialValue: '' });
  protected mcp = toSignal(
    this.sdk.currentKb.pipe(
      switchMap((kb) =>
        this.zoneService
          .buildZoneUrl(kb.zone, this.sdk.nuclia.options.backend, 'dp')
          .pipe(map((baseUrl) => `${baseUrl}/v1${kb.path}/mcp`)),
      ),
    ),
    { initialValue: '' },
  );

  protected copy(field: CopyField, value: string): void {
    navigator.clipboard.writeText(value);
    this.copiedField.set(field);
    setTimeout(() => this.copiedField.set(null), 1000);
  }

  protected close(): void {
    this.modal.close();
  }
}
