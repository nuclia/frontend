import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { BackendConfigurationService, LowerCaseInputDirective } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  PaAvatarModule,
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { RECAPTCHA_V3_SITE_KEY, RecaptchaV3Module } from 'ng-recaptcha-2';
import { CheckMailComponent } from './check-mail/check-mail.component';
import { ConsentComponent } from './consent/consent.component';
import { consentResolver } from './consent/consent.resolver';
import { LoginComponent } from './login/login.component';
import { loginResolver } from './login/login.resolver';
import { MagicComponent } from './magic/magic.component';
import { RecoverComponent } from './recover/recover.component';
import { ResetComponent } from './reset/reset.component';
import { SignupComponent } from './signup/signup.component';
import { SsoButtonComponent } from './sso/sso-button.component';
import { UserContainerComponent } from './user-container';
import { CallbackComponent } from './callback/callback.component';

export const authRoutes: Routes = [
  { path: 'callback', component: CallbackComponent },
  {
    path: 'callbacks/saml',
    component: CallbackComponent,
    data: { saml: true },
  },
  {
    path: 'callbacks/google',
    component: CallbackComponent,
    data: { google: true },
  },
  {
    path: 'callbacks/github',
    component: CallbackComponent,
    data: { github: true },
  },
  {
    path: 'callbacks/microsoft',
    component: CallbackComponent,
    data: { microsoft: true },
  },
  { path: 'login', component: LoginComponent, resolve: { loginData: loginResolver } },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset', component: ResetComponent },
  { path: 'magic', component: MagicComponent },
  { path: 'join', component: MagicComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'check-mail', component: CheckMailComponent },
  { path: 'consent', component: ConsentComponent, resolve: { consentData: consentResolver } },
];

@NgModule({
  declarations: [
    LoginComponent,
    RecoverComponent,
    MagicComponent,
    ResetComponent,
    ConsentComponent,
    SignupComponent,
    SsoButtonComponent,
    CheckMailComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaV3Module,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    RouterModule.forChild(authRoutes),
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTextFieldModule,
    SisPasswordInputModule,
    UserContainerComponent,
    PaAvatarModule,
    PaButtonModule,
    LowerCaseInputDirective,
  ],
  exports: [RouterModule, SignupComponent, SsoButtonComponent, CheckMailComponent],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useFactory: (config: BackendConfigurationService) => config.getRecaptchaKey(),
      deps: [BackendConfigurationService],
    },
  ],
})
export class AuthUserModule {}
