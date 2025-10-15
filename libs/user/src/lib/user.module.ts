import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { authGuard, BackendConfigurationService, LowerCaseInputDirective } from '@flaps/core';
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
import { CallbackComponent } from './callback/callback.component';
import { CheckMailComponent } from './check-mail/check-mail.component';
import { ConsentComponent } from './consent/consent.component';
import { LoginComponent } from './login/login.component';
import { LogoutComponent } from './logout/logout.component';
import { MagicComponent } from './magic/magic.component';
import {
  EmbeddingModelStepComponent,
  KbNameStepComponent,
  OnboardingComponent,
  SettingUpComponent,
  Step1Component,
  ZoneStepComponent,
} from './onboarding';
import { ProfileComponent } from './profile/profile.component';
import { RecoverComponent } from './recover/recover.component';
import { ResetComponent } from './reset/reset.component';
import { SignupComponent } from './signup/signup.component';
import { SsoButtonComponent } from './sso/sso-button.component';
import { UserContainerModule } from './user-container';
import { UserContainerLogoComponent } from './user-container/user-container-logo/user-container-logo.component';

export const userRoutes: Routes = [
  { path: 'callback', component: CallbackComponent },
  {
    path: 'callbacks/saml',
    component: CallbackComponent,
    data: { saml: true },
  },
  {
    path: 'callbacks/oauth',
    component: CallbackComponent,
    data: { samlOauth: true },
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
  {
    path: 'profile',
    canActivate: [authGuard],
    component: ProfileComponent,
  },
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset', component: ResetComponent },
  { path: 'magic', component: MagicComponent },
  { path: 'join', component: MagicComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'check-mail', component: CheckMailComponent },
  { path: 'consent', component: ConsentComponent },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  declarations: [
    LoginComponent,
    RecoverComponent,
    LogoutComponent,
    MagicComponent,
    CallbackComponent,
    ResetComponent,
    ProfileComponent,
    ConsentComponent,
    UserContainerLogoComponent,
    SignupComponent,
    SsoButtonComponent,
    CheckMailComponent,
    OnboardingComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaV3Module,
    AngularSvgIconModule,
    RouterModule.forChild(userRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTextFieldModule,

    SisPasswordInputModule,
    UserContainerModule,
    PaAvatarModule,
    Step1Component,
    KbNameStepComponent,
    SettingUpComponent,
    PaButtonModule,
    ZoneStepComponent,
    EmbeddingModelStepComponent,
    LowerCaseInputDirective,
  ],
  exports: [RouterModule, SignupComponent, SsoButtonComponent, CheckMailComponent, OnboardingComponent],
  providers: [
    {
      provide: RECAPTCHA_V3_SITE_KEY,
      useFactory: (config: BackendConfigurationService) => config.getRecaptchaKey(),
      deps: [BackendConfigurationService],
    },
  ],
})
export class UserModule {}
