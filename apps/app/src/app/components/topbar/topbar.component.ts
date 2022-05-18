import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { BackendConfigurationService, UserService, SDKService } from '@flaps/auth';
import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { NavigationService } from '../../services/navigation.service';
import { filter, map, switchMap, take, tap } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { STFConfirmComponent } from '@flaps/components';
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopbarComponent implements AfterViewInit {
  userPrefs = this.userService.userPrefs;
  kb = this.sdk.currentKb;
  isStage = location.hostname === 'stashify.cloud';
  searchWidget = this.kb.pipe(
    map((kb) =>
      this.sanitized.bypassSecurityTrustHtml(`<nuclia-search id="search-widget" knowledgebox="${kb.id}"
    zone="${this.sdk.nuclia.options.zone}"
    widgetid="dashboard"
    client="dashboard"
    cdn="${this.backendConfig.getCDN() ? this.backendConfig.getCDN() + '/' : ''}"
    backend="${this.backendConfig.getAPIURL()}"
    state="${kb.state || ''}"
    kbslug="${kb.slug || ''}"
    account="${kb.account || ''}"
    type="input"></nuclia-search>`),
    ),
  );

  menuOpen: boolean = false;
  menuPosition = [
    new ConnectionPositionPair({ originX: 'end', originY: 'bottom' }, { overlayX: 'end', overlayY: 'top' }),
  ];

  switchOpen: boolean = false;

  constructor(
    private router: Router,
    private userService: UserService,
    private navigationService: NavigationService,
    private sdk: SDKService,
    private sanitized: DomSanitizer,
    private backendConfig: BackendConfigurationService,
    private dialog: MatDialog,
    private translate: TranslatePipe,
  ) {}

  goToHome(): void {
    this.router.navigate([this.navigationService.getHomeUrl()]);
  }

  ngAfterViewInit(): void {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      if (kb.admin || kb.contrib) {
        const waitForWidget = window.setInterval(() => {
          const widget = document.getElementById('search-widget') as unknown as any;
          if (widget) {
            const actions = [
              {
                label: this.translate.transform('generic.edit'),
                action: this.edit.bind(this),
              },
              {
                label: this.translate.transform('generic.delete'),
                action: this.delete.bind(this),
              },
            ];
            if (kb.admin) {
              actions.push({
                label: this.translate.transform('widget.show-api'),
                action: this.showUID.bind(this),
              });
            }
            widget.setActions(actions);
            clearInterval(waitForWidget);
          }
        }, 500);
      }
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
    this.dialog
      .open(STFConfirmComponent, {
        width: '470px',
        data: {
          title: 'generic.alert',
          message: 'resource.delete_resource_warning',
          minWidthButtons: '120px',
        },
      })
      .afterClosed()
      .pipe(
        filter((yes) => !!yes),
        switchMap(() => this.sdk.currentKb),
        switchMap((kb) => kb.getResource(uid)),
        switchMap((res) => res.delete()),
        tap(() => this.closeViewer()),
        take(1),
      )
      .subscribe(() => {
        setTimeout(() => {
          this.sdk.refreshCounter(true);
        }, 1000);
      });
  }

  edit(uid: string) {
    this.sdk.currentKb.pipe(take(1)).subscribe((kb) => {
      this.closeViewer();
      this.router.navigate([`/at/${kb.account}/${kb.slug}/resources/${uid}/profile`]);
    });
  }

  showUID(uid: string) {
    this.dialog
      .open(STFConfirmComponent, {
        width: '470px',
        data: {
          title: 'API',
          messageHtml$: this.sdk.currentKb.pipe(
            take(1),
            map(
              (kb) =>
                `<pre><code class="endpoint">${this.sdk.nuclia.rest.getFullUrl(kb.path)}/resource/${uid}</code></pre>`,
            ),
          ),
          onlyConfirm: true,
        },
      })
      .afterClosed()
      .subscribe();
  }

  closeViewer() {
    (document.getElementById('search-widget') as unknown as any)?.displayResource('');
  }
}
