import { MagicActionError, SDKService } from '@flaps/core';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MagicService } from './magic.service';
import { filter, map, Subject, switchMap, takeUntil } from 'rxjs';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
  standalone: false,
})
export class MagicComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  error = '';
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
        error: (error) => {
          if (error?.tokenError) {
            let message = 'login.token_expired';
            const cause = error.tokenError.detail as MagicActionError;
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

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
