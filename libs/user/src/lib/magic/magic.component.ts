import { SDKService } from '@flaps/core';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MagicService } from './magic.service';
import { filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { MagicActionError } from '@nuclia/core';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
  standalone: false,
})
export class MagicComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  error = '';
  showLoginCta = false;
  private readyCameFrom = '';
  constructor(
    private magicService: MagicService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private sdk: SDKService,
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(
        takeUntil(this.unsubscribeAll),
        map((params: ParamMap) => {
          const token = params.get('token');
          if (!token) {
            this.error = 'Missing token in the URL';
            this.cdr.markForCheck();
          }
          return token;
        }),
        filter((token) => !!token),
        switchMap((token) => this.magicService.validateToken(token as string)),
        switchMap((action) => this.magicService.execute(action)),
      )
      .subscribe({
        next: () => {
          if (this.magicService.readyToLogin) {
            this.readyCameFrom = this.magicService.cameFrom;
            this.showLoginCta = true;
            this.cdr.markForCheck();
          }
        },
        error: (error) => {
          if (error?.tokenError) {
            const cause = error.tokenError.detail as MagicActionError | 'login_challenge_expired_or_invalid';
            if (cause === 'login_challenge_expired_or_invalid') {
              // Legacy fallback (pre account_ready_please_login backends): account/password are
              // already set, only the OAuth dance timed out.
              this.showLoginCta = true;
              this.cdr.markForCheck();
              return;
            }
            let message = 'login.token_expired';
            if (cause === 'local_user_already_exists' || cause === 'user_registered_as_external_user') {
              message = `login.${cause}`;
            }
            this.sdk.nuclia.auth.redirectToOAuth({ message });
          } else {
            this.error = 'onboarding.failed';
            this.cdr.markForCheck();
          }
        },
      });
  }

  login() {
    // The auth app has no real OAuth client_id of its own; the flow must be (re)started from
    // the originating app (came_from), whose /user/login-redirect route holds the real client_id.
    if (this.readyCameFrom) {
      const url = new URL(`${this.readyCameFrom}/user/login-redirect`);
      url.searchParams.set('message', 'login.account_ready_please_login');
      url.searchParams.set('came_from', this.readyCameFrom);
      location.href = url.toString();
    } else {
      this.sdk.nuclia.auth.redirectToOAuth({ message: 'login.account_ready_please_login' });
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
