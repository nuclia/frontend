import { MagicActionError, TokenService } from '@flaps/core';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { MagicService } from './magic.service';
import { catchError, map, of, Subject, takeUntil, tap } from 'rxjs';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
  styleUrls: ['./magic.component.scss'],
})
export class MagicComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();

  token = '';
  constructor(
    private tokenService: TokenService,
    private magicService: MagicService,
    private route: ActivatedRoute,
    private router: Router,
    private toaster: SisToastService,
  ) {}

  ngOnInit() {
    this.route.queryParamMap
      .pipe(
        takeUntil(this.unsubscribeAll),
        map((params: ParamMap) => params.get('token')),
      )
      .subscribe((token) => {
        if (!token) {
          this.toaster.error('Missing token in the URL');
        }
        this.token = token || '';
      });
  }

  join() {
    if (this.token) {
      this.tokenService
        .validate(this.token)
        .pipe(
          tap((data) => this.magicService.execute(data)),
          catchError((error) => {
            let message: string;
            const cause = error.detail as MagicActionError;
            if (cause === 'local_user_already_exists' || cause === 'user_registered_as_external_user') {
              message = `login.${cause}`;
            } else {
              message = 'login.token_expired';
            }
            this.router.navigate(['/user/login'], {
              queryParams: { message: message },
            });
            return of(null);
          }),
        )
        .subscribe();
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
