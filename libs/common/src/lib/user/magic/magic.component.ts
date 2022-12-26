import { MagicAction, MagicActionError, TokenService } from '@flaps/core';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { MagicService } from './magic.service';

@Component({
  selector: 'stf-magic',
  templateUrl: './magic.component.html',
  styleUrls: ['./magic.component.css'],
})
export class MagicComponent implements OnDestroy {
  private subscription: Subscription;

  magic$: Observable<MagicAction>;
  message = 'Loading...';

  constructor(
    private tokenService: TokenService,
    private magicService: MagicService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.magic$ = this.route.queryParamMap.pipe(
      switchMap((params: ParamMap) => {
        const token = params.get('token');
        return this.tokenService.validate(token!);
      }),
    );

    this.subscription = this.magic$.subscribe(
      (data) => {
        this.magicService.execute(data);
      },
      (error) => {
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
      },
    );
  }
  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
