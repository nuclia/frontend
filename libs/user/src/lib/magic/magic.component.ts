import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { BackendConfigurationService } from '@flaps/core';
import { MagicService } from './magic.service';
import { filter, map, Subject, switchMap, takeUntil } from 'rxjs';
import { getLoginErrorMessageKey, isCameFromLegit } from '../login-error.util';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
  standalone: false,
})
export class MagicComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  error = '';
  private readyCameFrom = '';
  constructor(
    private magicService: MagicService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private config: BackendConfigurationService,
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
            // Account/password are already set, only the login_challenge is stale, we need user to login again;
            this.login('login.account_ready_please_login');
          }
        },
        error: (error) => {
          if (error?.tokenError) {
            const code = error.tokenError.error_code || error.tokenError.detail;
            // The backend recovers came_from for tokens that are expired/used/invite-cancelled but
            // still resolvable, so we can restart fresh at the originating app just like a stale
            // login_challenge, instead of dead-ending here.
            if (error.tokenError.came_from) {
              this.readyCameFrom = error.tokenError.came_from;
            }
            const message =
              code === 'login_challenge_expired_or_invalid'
                ? 'login.account_ready_please_login'
                : getLoginErrorMessageKey(code, 'login.token_expired');
            this.login(message);
          } else {
            this.error = 'onboarding.failed';
            this.cdr.markForCheck();
          }
        },
      });
  }

  private login(message: string) {
    // The auth app has no real OAuth client_id of its own; the flow must be (re)started from the originating app (came_from)
    if (this.readyCameFrom && isCameFromLegit(this.readyCameFrom, this.config.getAPIOrigin())) {
      // Strip down to the origin in case the backend ever sends came_from with a path/query.
      const url = new URL(new URL(this.readyCameFrom).origin);
      url.searchParams.set('message', message);
      location.href = url.toString();
    } else {
      this.error = 'login.error.missing_came_from';
      this.cdr.markForCheck();
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
