import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';

import { SetupStep1Component } from './setup-step1/setup-step1.component';
import { SetupContainerComponent } from './setup-container/setup-container.component';
import { SetupHeaderComponent } from './setup-header/setup-header.component';
import { SetupStep2Component } from './setup-step2/setup-step2.component';
import { SetupInviteComponent } from './setup-invite/setup-invite.component';
import { SetupAccountComponent } from './setup-account/setup-account.component';
import { FarewellComponent } from './farewell/farewell.component';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { UserContainerModule } from '@flaps/common';

const Components = [
  SetupContainerComponent,
  SetupHeaderComponent,
  SetupStep1Component,
  SetupStep2Component,
  SetupInviteComponent,
  SetupAccountComponent,
  FarewellComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    MatRadioModule,
    PaIconModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    UserContainerModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class SetupModule {}
