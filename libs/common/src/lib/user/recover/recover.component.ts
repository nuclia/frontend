import { ChangeDetectionStrategy, Component, Inject, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgForm, UntypedFormBuilder, Validators } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { BackendConfigurationService, LoginService, RecoverData } from '@flaps/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'stf-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoverComponent {
  recoverForm = this.formBuilder.group({
    email: ['', [Validators.required]],
  });

  recoverValidationMessages = {
    email: {
      required: 'validation.required',
    },
  };

  @ViewChild('form') form?: NgForm;

  constructor(
    private formBuilder: UntypedFormBuilder,
    private loginService: LoginService,
    private router: Router,
    private route: ActivatedRoute,
    private reCaptchaV3Service: ReCaptchaV3Service,
    private config: BackendConfigurationService,
    private modalService: SisModalService,
    private translate: TranslatePipe,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  goLogin() {
    this.router.navigate(['../login'], {
      relativeTo: this.route,
      queryParamsHandling: 'merge', // Preserve login_challenge
    });
  }

  onEnterPressed() {
    (this.document.activeElement as HTMLElement).blur(); // Update email before submit
    this.form?.onSubmit({} as Event);
  }

  submit() {
    if (!this.recoverForm.valid) return;
    this.reCaptchaV3Service.execute(this.config.getRecaptchaKey(), 'recover', (token) => {
      this.recover(token);
    });
  }

  recover(token: string) {
    const recoverInfo = new RecoverData(this.recoverForm.value.email, this.config.getAppName());
    const description = `${this.translate.transform('login.email_sent')} <br> ${this.translate.transform(
      'recover.verify',
    )}`;
    this.loginService.recover(recoverInfo, token).subscribe(() => {
      this.modalService.openConfirm({
        title: 'login.check_email',
        description,
        confirmLabel: 'Ok',
        onlyConfirm: true,
      });
    });
  }
}
