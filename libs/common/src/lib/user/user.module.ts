import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LoggedinGuard, STFPipesModule } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { FlexLayoutModule } from '@angular/flex-layout';
import { STFButtonDirectivesModule, STFInputModule } from '@flaps/pastanaga';
import { UserAvatarModule } from '@flaps/components';
import { NgxCaptchaModule } from 'ngx-captcha';

import { OldLoginComponent } from './login/old-login.component';
import { RecoverComponent } from './recover/recover.component';
import { MagicComponent } from './magic/magic.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetComponent } from './reset/reset.component';
import { CallbackComponent } from './callback/callback.component';
import { AccountComponent } from './account/account.component';
import { ProfileComponent } from './profile/profile.component';
import { SwitchComponent } from './switch/switch.component';
import { ConsentComponent } from './consent/consent.component';
import { OldSignupComponent } from './signup/old-signup.component';
import { OldUserContainerComponent } from './user-container/old-user-container.component';
import { UserContainerLogoComponent } from './user-container/user-container-logo/user-container-logo.component';
import { UserErrorComponent } from './user-error/user-error.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { SisPasswordInputModule } from '@nuclia/sistema';
import { SignupComponent } from './signup/signup.component';
import { SsoButtonComponent } from './sso/sso-button.component';
import { CheckMailComponent } from './check-mail/check-mail.component';
import { UserContainerModule } from './user-container';
import { OnboardingComponent } from './onboarding/onboarding.component';

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
    path: 'account',
    canActivate: [LoggedinGuard],
    component: AccountComponent,
  },
  {
    path: 'switch',
    canActivate: [LoggedinGuard],
    component: SwitchComponent,
  },
  {
    path: 'profile',
    canActivate: [LoggedinGuard],
    component: ProfileComponent,
  },
  { path: 'login', component: OldLoginComponent },
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
    OldLoginComponent,
    RecoverComponent,
    LogoutComponent,
    MagicComponent,
    CallbackComponent,
    AccountComponent,
    ResetComponent,
    ProfileComponent,
    SwitchComponent,
    ConsentComponent,
    OldSignupComponent,
    OldUserContainerComponent,
    UserContainerLogoComponent,
    UserErrorComponent,
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
    MatListModule,
    MatCardModule,
    MatExpansionModule,
    MatSelectModule,
    MatDialogModule,
    FlexLayoutModule,
    STFInputModule,
    STFButtonDirectivesModule,
    STFPipesModule,
    UserAvatarModule,
    RouterModule.forChild(userRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTextFieldModule,

    SisPasswordInputModule,
    UserContainerModule,
  ],
  exports: [RouterModule, SignupComponent, SsoButtonComponent, CheckMailComponent, OnboardingComponent],
})
export class UserModule {}
