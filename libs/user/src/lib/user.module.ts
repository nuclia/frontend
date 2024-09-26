import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { authGuard, LowerCaseInputDirective } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { NgxCaptchaModule } from 'ngx-captcha';

import { LoginComponent } from './login/login.component';
import { RecoverComponent } from './recover/recover.component';
import { MagicComponent } from './magic/magic.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetComponent } from './reset/reset.component';
import { CallbackComponent } from './callback/callback.component';
import { ProfileComponent } from './profile/profile.component';
import { ConsentComponent } from './consent/consent.component';
import { UserContainerLogoComponent } from './user-container/user-container-logo/user-container-logo.component';
import {
  PaAvatarModule,
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { SignupComponent } from './signup/signup.component';
import { SsoButtonComponent } from './sso/sso-button.component';
import { CheckMailComponent } from './check-mail/check-mail.component';
import { UserContainerModule } from './user-container';
import {
  EmbeddingModelStepComponent,
  KbNameStepComponent,
  OnboardingComponent,
  SettingUpComponent,
  Step1Component,
  VectorDatabaseStepComponent,
  ZoneStepComponent,
} from './onboarding';

export const userRoutes: Routes = [
  { path: 'callback', component: CallbackComponent }, // Is this route used ?
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
    NgxCaptchaModule,
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
    VectorDatabaseStepComponent,
    LowerCaseInputDirective,
  ],
  exports: [RouterModule, SignupComponent, SsoButtonComponent, CheckMailComponent, OnboardingComponent],
})
export class UserModule {}
