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
import { STFButtonDirectivesModule, STFButtonsModule, STFInputModule } from '@flaps/pastanaga';
import { STFCheckboxModule } from '../checkbox/checkbox.module';
import { UserAvatarModule } from '@flaps/components';
import { NgxCaptchaModule } from 'ngx-captcha';

import { LoginComponent } from './login/login.component';
import { RecoverComponent } from './recover/recover.component';
import { MagicComponent } from './magic/magic.component';
import { LogoutComponent } from './logout/logout.component';
import { ResetComponent } from './reset/reset.component';
import { CallbackComponent } from './callback/callback.component';
import { AccountComponent } from './account/account.component';
import { ProfileComponent } from './profile/profile.component';
import { SwitchComponent } from './switch/switch.component';
import { ConsentComponent } from './consent/consent.component';
import { SignupComponent } from './signup/signup.component';
import { UserContainerComponent } from './user-container/user-container.component';
import { UserContainerLogoComponent } from './user-container/user-container-logo/user-container-logo.component';
import { UserErrorComponent } from './user-error/user-error.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

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
  { path: 'login', component: LoginComponent },
  { path: 'logout', component: LogoutComponent },
  { path: 'recover', component: RecoverComponent },
  { path: 'reset', component: ResetComponent },
  { path: 'magic', component: MagicComponent },
  { path: 'join', component: MagicComponent },
  { path: 'signup', component: SignupComponent },
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
    AccountComponent,
    ResetComponent,
    ProfileComponent,
    SwitchComponent,
    ConsentComponent,
    SignupComponent,
    UserContainerComponent,
    UserContainerLogoComponent,
    UserErrorComponent,
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
    STFButtonsModule,
    STFButtonDirectivesModule,
    STFPipesModule,
    STFCheckboxModule,
    UserAvatarModule,
    RouterModule.forChild(userRoutes),
    TranslateModule.forChild(),
    PaButtonModule,
    PaIconModule,
    PaTogglesModule,
    PaTextFieldModule,
  ],
  exports: [RouterModule],
})
export class UserModule {}
