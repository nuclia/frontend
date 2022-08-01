import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { STFCheckboxModule } from '@flaps/common';
import { STFTagModule } from '@flaps/components';
import { STFExpanderModule } from '@flaps/pastanaga';
import { STFButtonsModule } from '@flaps/pastanaga';

import { LabelListComponent } from './label-list/label-list.component';
import { LabelSelectComponent } from './label-select/label-select.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { LabelFieldComponent } from './label-field/label-field.component';

const components = [LabelListComponent, LabelSelectComponent, LabelFieldComponent];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    OverlayModule,
    TranslateModule.forChild(),
    STFCheckboxModule,
    STFTagModule,
    STFExpanderModule,
    STFButtonsModule,
  ],
  declarations: [...components],
  exports: [...components],
})
export class LabelModule {}
