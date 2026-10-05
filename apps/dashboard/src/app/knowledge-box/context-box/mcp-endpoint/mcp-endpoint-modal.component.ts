import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationService, SDKService, ZoneService } from '@flaps/core';
import { ModalRef, PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, map, shareReplay, switchMap, take } from 'rxjs';
import { ContextBoxService } from '../context-box/context-box.service';

@Component({
  templateUrl: './mcp-endpoint-modal.component.html',
  styleUrl: './mcp-endpoint-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaModalModule, PaButtonModule, AsyncPipe, TranslatePipe],
})
export class McpEndpointModalComponent {
  sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private navigation = inject(NavigationService);
  private contextBoxService = inject(ContextBoxService);
  modal = inject(ModalRef);

  private agent = this.contextBoxService.getContextBoxAgent().pipe(shareReplay(1));

  endpoint = this.agent.pipe(
    switchMap((agent) =>
      this.zoneService
        .buildZoneUrl(agent.zone, this.sdk.nuclia.options.backend, 'dp')
        .pipe(map((baseUrl) => `${baseUrl}/v1${agent.path}/session/ephemeral/mcp`)),
    ),
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

  goToApiKeys() {
    this.modal.close();
    combineLatest([this.sdk.currentAccount, this.agent])
      .pipe(take(1))
      .subscribe(([account, agent]) => {
        this.navigation.navigateExternal(`${this.navigation.getRetrievalAgentUrl(account.slug, agent.slug)}/keys`);
      });
  }
}
