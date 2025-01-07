import { combineLatest, filter, map, Observable, switchMap, take } from 'rxjs';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, NavigationService, SDKService } from '@flaps/core';
import { Injectable, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { FieldFullId } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class ResourceViewerService {
  private widgetSelector?: string;

  constructor(
    private router: Router,
    private sdk: SDKService,
    private translation: TranslateService,
    private modalService: SisModalService,
    private zone: NgZone,
    private features: FeaturesService,
    private navigationService: NavigationService,
  ) {}

  init(widgetSelector: string) {
    this.widgetSelector = widgetSelector;
    this.features.isKbAdminOrContrib.pipe(take(1)).subscribe((isKbAdminOrContrib) => {
      const waitForWidget = window.setInterval(() => {
        const widget = document.querySelector(widgetSelector) as unknown as any;
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
                label: this.translation.instant('resource.reprocess'),
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
    this.closeViewer();
    this.modalService
      .openConfirm({
        title: 'resource.confirm-delete.title',
        description: 'resource.confirm-delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
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

  reindex(fullId: FieldFullId) {
    this.closeViewer();
    this.modalService
      .openConfirm({
        title: 'resource.confirm-reprocess.title',
        description: 'resource.confirm-reprocess.description',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.sdk.currentKb),
        take(1),
        switchMap((kb) => kb.getResource(fullId.resourceId)),
        switchMap((res) => res.reprocess()),
      )
      .subscribe();
  }

  showUID(fullId: FieldFullId) {
    this.closeViewer();
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
    if (this.widgetSelector) {
      (document.querySelector(this.widgetSelector) as unknown as any)?.closePreview();
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
      map(([kb, account]) => {
        const kbSlug = (this.sdk.nuclia.options.standalone ? kb.id : kb.slug) as string;
        return `${this.navigationService.getKbUrl(account.slug, kbSlug)}/resources`;
      }),
    );
  }
  private navigateTo(path: string) {
    this.zone.run(() => this.router.navigate([path]));
  }
}
