import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatRadioModule } from '@angular/material/radio';
import {
  STFButtonsModule,
  STFInputModule,
  STFExpanderModule,
  STFFormDirectivesModule,
  STFButtonDirectivesModule,
  STFTooltipModule,
} from '@flaps/pastanaga';

import { SetupStep1Component } from './setup-step1/setup-step1.component';
import { SetupContainerComponent } from './setup-container/setup-container.component';
import { SetupHeaderComponent } from './setup-header/setup-header.component';
import { SetupStep2Component } from './setup-step2/setup-step2.component';
import { SetupLoaderComponent } from './setup-loader/setup-loader.component';
import { SetupInviteComponent } from './setup-invite/setup-invite.component';
import { SetupAccountComponent } from './setup-account/setup-account.component';

const Components = [
  SetupContainerComponent,
  SetupHeaderComponent,
  SetupLoaderComponent,
  SetupStep1Component,
  SetupStep2Component,
  SetupInviteComponent,
  SetupAccountComponent,
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    STFButtonsModule,
    STFInputModule,
    STFExpanderModule,
    STFTooltipModule,
    STFFormDirectivesModule,
    STFButtonDirectivesModule,
    MatRadioModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class SetupModule {}
