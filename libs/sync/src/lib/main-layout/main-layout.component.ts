import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { CONNECTOR_ID_KEY, getDeeplink, SOURCE_NAME_KEY, SyncService } from '@nuclia/sync';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, of, repeat, switchMap, Subject, takeUntil, take } from 'rxjs';
import { BackendConfigurationService, SDKService } from '@flaps/core';

@Component({
  selector: 'nsy-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent implements OnDestroy {
  unsubscribeAll = new Subject<void>();

  constructor(
    private sync: SyncService,
    private sdk: SDKService,
    private route: ActivatedRoute,
    private router: Router,
    private config: BackendConfigurationService,
  ) {
    const path = this.route.pathFromRoot
      .map((item) => item.snapshot.url)
      .filter((segments) => segments.length > 0)
      .map((segments) => segments.map((segment) => segment.path).join('/'))
      .join('/');
    this.sync.setBasePath(path ? `/${path}/` : '/');

    if (this.config.staticConf.client === 'dashboard') {
      // Automatically select current account (In dashboard there's no account selection page like in Desktop app)
      this.sdk.currentAccount.pipe(take(1)).subscribe((account) => {
        this.sync.selectAccount(account.slug, account.id);
      });

      // Check if it's a redirect from OAuth server
      if (localStorage.getItem(CONNECTOR_ID_KEY) && localStorage.getItem(SOURCE_NAME_KEY)) {
        const deeplink = getDeeplink();
        if (deeplink && deeplink.includes('?')) {
          this.router.navigateByUrl(`${path}/add-upload${deeplink}`);
        }
      }
    }

    of(true)
      .pipe(
        filter(() => !!this.sync.getSyncServer()),
        switchMap(() => this.sync.serverStatus(this.sync.getSyncServer())),
        map((res) => !res.running),
        repeat({ delay: 5000 }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((isServerDown) => this.sync.setServerStatus(isServerDown));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
