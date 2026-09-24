import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

import { UserContainerComponent } from '../user-container';
import { FarewellComponent } from './farewell.component';
import { FeedbackComponent } from './feedback.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    RouterModule,
    UserContainerComponent,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    FarewellComponent,
    FeedbackComponent,
  ],
  exports: [],
})
export class FarewellModule {}
