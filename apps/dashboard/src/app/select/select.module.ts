import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { STFButtonsModule, AutoFocusModule, STFTooltipModule } from '@flaps/pastanaga';
import { ButtonActionModule } from '../components/button-action/button-action.module';

import { SelectComponent } from './select.component';
import { SelectKbComponent } from './select-kb/select-kb.component';

const Components = [SelectComponent, SelectKbComponent];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    STFButtonsModule,
    AutoFocusModule,
    STFTooltipModule,
    ButtonActionModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class SelectModule {}
