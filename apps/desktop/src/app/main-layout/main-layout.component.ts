import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { filter, take } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'da-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  isLogged = false;
  constructor(
    private router: Router,
    private sync: SyncService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(
        filter((yes) => yes),
        take(1),
      )
      .subscribe(() => {
        if (!this.sync.getAccountId()) {
          this.router.navigate(['/select']);
        }
        this.isLogged = true;
        this.cdr?.markForCheck();
      });
  }
}
