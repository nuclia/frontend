import { filter, map, switchMap, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { SDKService, STFTrackingService } from '@flaps/core';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ResourceViewerService {
  constructor(
    private router: Router,
    private sdk: SDKService,
    private translation: TranslateService,
    private modalService: SisModalService,
    private trackingService: STFTrackingService,
  ) {}

  init(widgetId: string) {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      const waitForWidget = window.setInterval(() => {
        const widget = document.getElementById(widgetId) as unknown as any;
        if (widget) {
          const actions = [
            {
              label: this.translation.instant('widget.show-api'),
              destructive: false,
              action: this.showUID.bind(this),
            },
          ];
          if (kb.admin || kb.contrib) {
            actions.push(
              {
                label: this.translation.instant('generic.edit'),
                destructive: false,
                action: this.edit.bind(this),
              },
              {
                label: this.translation.instant('generic.delete'),
                destructive: true,
                action: this.delete.bind(this),
              },
            );
          }
          widget.setActions(actions);
          widget.addEventListener('search', () => this.trackingService.logEvent('search'));
          clearInterval(waitForWidget);
        }
      }, 500);
    });
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(
        filter((isAuth) => !isAuth),
        take(1),
      )
      .subscribe(() => {
        this.closeViewer();
      });
  }

  delete(uid: string) {
    this.modalService
      .openConfirm({
        title: 'generic.alert',
        description: 'resource.delete_resource_warning',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.getResource(uid)),
        switchMap((res) => res.delete()),
        tap(() => this.closeViewer()),
      )
      .subscribe(() => {
        setTimeout(() => {
          this.sdk.refreshCounter(true);
        }, 1000);
      });
  }

  edit(uid: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        filter((kb) => !!kb.admin || !!kb.contrib),
      )
      .subscribe((kb) => {
        this.closeViewer();
        this.router.navigate([`/at/${kb.account}/${kb.slug}/resources/${uid}/profile`]);
      });
  }

  showUID(uid: string) {
    this.sdk.currentKb
      .pipe(
        take(1),
        map(
          (kb) =>
            `<pre><code class="endpoint">${this.sdk.nuclia.rest.getFullUrl(kb.path)}/resource/${uid}</code></pre>`,
        ),
        switchMap(
          (uidEndpoint) =>
            this.modalService.openConfirm({
              title: 'API',
              description: uidEndpoint,
              onlyConfirm: true,
              confirmLabel: 'OK',
            }).onClose,
        ),
      )
      .subscribe();
  }

  closeViewer() {
    (document.getElementById('search-widget') as unknown as any)?.displayResource('');
  }
}
