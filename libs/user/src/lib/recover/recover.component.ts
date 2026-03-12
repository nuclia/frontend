import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';

import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService, LoginService, RecoverData } from '@flaps/core';
import { TranslateService } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';
import { ReCaptchaV3Service } from 'ng-recaptcha-2';
import { forkJoin, map } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'nus-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class RecoverComponent {
  recoverForm = new FormGroup({
    email: new FormControl<string>('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
  });

  recoverValidationMessages = {
    email: {
      required: 'validation.required',
      email: 'validation.email',
    },
  };
  loginChallenge = '';
  isPasswordInit = false;

  constructor(
    private route: ActivatedRoute,
    private loginService: LoginService,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private modalService: SisModalService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.queryParams.subscribe((params) => {
      this.loginChallenge = params['login_challenge'];
      this.isPasswordInit = params['isPasswordInit'];
      this.cdr.markForCheck();
    });
  }

  submit() {
    if (!this.recoverForm.valid) return;
    this.reCaptchaV3Service.execute('recover').subscribe({
      next: (token) => {
        this.recover(token);
      },
      error: (error) => {
        throw new Error('Recaptcha error', error);
      },
    });
  }

  recover(token: string) {
    const recoverInfo: RecoverData = {
      username: this.recoverForm.getRawValue().email,
      app: this.config.getAppName(),
      login_challenge: this.loginChallenge,
      initial_setpassword: this.isPasswordInit,
    };
    this.loginService
      .recover(recoverInfo, token)
      .pipe(
        switchMap(() =>
          forkJoin([this.translate.get('login.check_email.email_sent'), this.translate.get('recover.verify')]),
        ),
        map((messages) => messages.join('<br>')),
        switchMap(
          (description) =>
            this.modalService.openConfirm({
              title: 'login.check_email.title',
              description,
              confirmLabel: 'Ok',
              onlyConfirm: true,
            }).onClose,
        ),
      )
      .subscribe();
  }

  goBack() {
    history.back();
  }
}
