import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import {
  PaAvatarModule,
  PaButtonModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { CallbackComponent } from './callback/callback.component';
import { ProfileComponent } from './profile/profile.component';

export const appRoutes: Routes = [
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
];

@NgModule({
  declarations: [CallbackComponent, ProfileComponent],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    RouterModule.forChild(appRoutes),
    PaButtonModule,
    PaTogglesModule,
    PaIconModule,
    PaTextFieldModule,
    PaAvatarModule,
    PaButtonModule,
  ],
  exports: [RouterModule],
})
export class AppUserModule {}
