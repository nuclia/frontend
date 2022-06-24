import { Component, Inject, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { UntypedFormBuilder, Validators, NgForm } from '@angular/forms';
import { ReCaptchaV3Service } from 'ngx-captcha';
import { MatDialog } from '@angular/material/dialog';
import { LoginService, BackendConfigurationService, RecoverData } from '@flaps/auth';
import { STFConfirmComponent } from '@flaps/components';

@Component({
  selector: 'stf-recover',
  templateUrl: './recover.component.html',
  styleUrls: ['./recover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
    private dialog: MatDialog,
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
    this.loginService.recover(recoverInfo, token)
      .subscribe(() => {
        this.dialog.open(STFConfirmComponent, {
          width: '420px',
          data: {
            title: 'login.check_email',
            messages: ['login.email_sent', 'recover.verify'],
            confirmText: 'Ok',
            onlyConfirm: true,
            minWidthButtons: '110px'
          }
        });
      }
    );
  }
}
