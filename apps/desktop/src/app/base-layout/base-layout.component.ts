import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { catchError, filter, of, switchMap, take } from 'rxjs';
import { ACCOUNT_KEY, SyncService } from '@nuclia/sync';

@Component({
  selector: 'nde-base-layout',
  templateUrl: './base-layout.component.html',
  styleUrls: ['./base-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseLayoutComponent {
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
        switchMap(() => {
          const accountId = this.sync.getAccountId();
          return !accountId
            ? of(false)
            : this.sdk.nuclia.db.getKnowledgeBoxes(accountId).pipe(
                catchError(() => {
                  localStorage.removeItem(ACCOUNT_KEY);
                  this.sdk.nuclia.auth.logout();
                  this.router.navigate(['/']);
                  return of(false);
                }),
              );
        }),
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
