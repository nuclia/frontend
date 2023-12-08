import { MagicActionError, TokenService } from '@flaps/core';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MagicService } from './magic.service';
import { catchError, filter, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
})
export class MagicComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  error = '';
  constructor(
    private tokenService: TokenService,
    private magicService: MagicService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
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
        switchMap((token) => this.tokenService.validate(token as string)),
        tap((data) => this.magicService.execute(data)),
        catchError((error) => {
          const cause = error.detail as MagicActionError;
          if (cause === 'local_user_already_exists' || cause === 'user_registered_as_external_user') {
            this.error = `login.${cause}`;
          } else {
            this.error = 'login.token_expired';
          }
          this.router.navigate(['/user/login'], {
            queryParams: { message: this.error },
          });
          return of(null);
        }),
      )
      .subscribe({
        error: () => {
          this.error = 'onboarding.failed';
          this.cdr.markForCheck();
        },
      });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
