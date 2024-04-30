import { combineLatest, filter, map, Observable, switchMap, take, tap } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, SDKService, STFTrackingService } from '@flaps/core';
import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FieldFullId } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class ResourceViewerService {
  private widgetId?: string;

  constructor(
    private router: Router,
    private sdk: SDKService,
    private translation: TranslateService,
    private modalService: SisModalService,
    private trackingService: STFTrackingService,
    private zone: NgZone,
    private features: FeaturesService,
  ) {}

  init(widgetId: string) {
    this.widgetId = widgetId;
    this.features.isKbAdminOrContrib.pipe(take(1)).subscribe((isKbAdminOrContrib) => {
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
          if (isKbAdminOrContrib) {
            actions.push(
              {
                label: this.translation.instant('resource.menu.edit'),
                destructive: false,
                action: this.edit.bind(this),
              },
              {
                label: this.translation.instant('resource.menu.annotate'),
                destructive: false,
                action: this.annotate.bind(this),
              },
              {
                label: this.translation.instant('resource.menu.classify'),
                destructive: false,
                action: this.classify.bind(this),
              },
              {
                label: this.translation.instant('generic.reindex'),
                destructive: false,
                action: this.reindex.bind(this),
              },
              {
                label: this.translation.instant('generic.delete'),
                destructive: true,
                action: this.delete.bind(this),
              },
            );
          }
          widget.setViewerMenu(actions);
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

  delete(fullId: FieldFullId) {
    this.modalService
      .openConfirm({
        title: 'resource.confirm-delete.title',
        description: 'resource.confirm-delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        tap(() => this.closeViewer()),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.getResource(fullId.resourceId)),
        switchMap((res) => res.delete()),
      )
      .subscribe(() => {
        this.reloadSearch();
        setTimeout(() => {
          this.sdk.refreshCounter(true);
        }, 1000);
      });
  }

  edit(fullId: FieldFullId) {
    this.getResourcesBasePath().subscribe((basePath) => {
      this.closeViewer();
      this.navigateTo(`${basePath}/${fullId.resourceId}/edit`);
    });
  }

  annotate(fullId: FieldFullId) {
    this.getResourcesBasePath().subscribe((basePath) => {
      this.closeViewer();
      this.navigateTo(`${basePath}/${fullId.resourceId}/edit/annotation`);
    });
  }

  classify(fullId: FieldFullId) {
    this.getResourcesBasePath().subscribe((basePath) => {
      this.closeViewer();
      this.navigateTo(`${basePath}/${fullId.resourceId}/edit/classification`);
    });
  }

  reindex(fullId: FieldFullId) {
    this.modalService
      .openConfirm({
        title: 'resource.confirm-reprocess.title',
        description: 'resource.confirm-reprocess.description',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        tap(() => this.closeViewer()),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.getResource(fullId.resourceId)),
        switchMap((res) => res.reprocess()),
      )
      .subscribe();
  }

  showUID(fullId: FieldFullId) {
    this.sdk.currentKb
      .pipe(
        take(1),
        map(
          (kb) =>
            `<pre><code class="endpoint">${this.sdk.nuclia.rest.getFullUrl(kb.path)}/resource/${
              fullId.resourceId
            }</code></pre>`,
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
    if (this.widgetId) {
      (document.getElementById(this.widgetId) as unknown as any)?.closePreview();
    }
  }

  reloadSearch() {
    const searchBar = document.querySelector('nuclia-search-bar') as any;
    if (typeof searchBar?.reloadSearch === 'function') {
      searchBar.reloadSearch();
    }
  }

  private getResourcesBasePath(): Observable<string> {
    return combineLatest([this.sdk.currentKb, this.sdk.currentAccount]).pipe(
      take(1),
      filter(([kb]) => !!kb.admin || !!kb.contrib),
      map(([kb, account]) => `/at/${account.slug}/${kb.slug}/resources`),
    );
  }
  private navigateTo(path: string) {
    this.zone.run(() => this.router.navigate([path]));
  }
}
