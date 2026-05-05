import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalRef, PaModalModule, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '@flaps/core';
import { map, take } from 'rxjs';
import { setZoneInRegionalUrl } from '@nuclia/core';

@Component({
  imports: [CommonModule, PaButtonModule, PaModalModule, TranslateModule],
  templateUrl: './mcp-endpoint-modal.component.html',
  styleUrl: './mcp-endpoint-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpEndpointModalComponent {
  sdk = inject(SDKService);
  modal = inject(ModalRef);

  endpoint = this.sdk.currentKb.pipe(
    map((kb) => setZoneInRegionalUrl(this.sdk.nuclia.options.backend, kb.zone, 'dp') + `/v1${kb.path}/mcp`),
  );
  copied = signal(false);

  copyEndpoint() {
    this.endpoint.pipe(take(1)).subscribe((endpoint) => {
      navigator.clipboard.writeText(endpoint).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2000);
      });
    });
  }
}
