import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ModalRef, PaButtonModule, PaModalModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService, ZoneService } from '@flaps/core';
import { catchError, map, of, switchMap } from 'rxjs';

@Component({
  imports: [CommonModule, PaButtonModule, PaModalModule, PaTextFieldModule, TranslateModule],
  templateUrl: './mcp-endpoint-modal.component.html',
  styleUrl: './mcp-endpoint-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpEndpointModalComponent {
  private sdk = inject(SDKService);
  private zoneService = inject(ZoneService);

  protected modal = inject(ModalRef);
  protected copied = signal(false);

  protected endpoint = toSignal(
    this.sdk.currentArag.pipe(
      switchMap((arag) =>
        this.zoneService
          .buildZoneUrl(arag.zone, this.sdk.nuclia.options.backend, 'dp')
          .pipe(map((baseUrl) => `${baseUrl}/v1${arag.path}/session/ephemeral/mcp`)),
      ),
      catchError(() => of('')),
    ),
    { initialValue: '' },
  );

  protected copy(): void {
    navigator.clipboard.writeText(this.endpoint());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1000);
  }

  protected close(): void {
    this.modal.close();
  }
}
