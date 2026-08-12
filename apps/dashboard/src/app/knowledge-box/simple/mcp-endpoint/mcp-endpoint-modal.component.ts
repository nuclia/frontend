import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { NavigationService, SDKService, ZoneService } from '@flaps/core';
import { switchMap, take } from 'rxjs';

@Component({
  standalone: false,
  templateUrl: './mcp-endpoint-modal.component.html',
  styleUrl: './mcp-endpoint-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class McpEndpointModalComponent {
  sdk = inject(SDKService);
  private zoneService = inject(ZoneService);
  private navigation = inject(NavigationService);
  private router = inject(Router);
  modal = inject(ModalRef);

  endpoint = this.sdk.currentKb.pipe(
    switchMap((kb) => this.zoneService.buildMcpEndpointUrl(kb, this.sdk.nuclia.options.backend)),
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
    this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
      this.router.navigate([`${this.navigation.getAccountManageUrl(account.slug)}/home/api-keys`]);
    });
  }
}
