import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { SisProgressModule } from '@nuclia/sistema';
import { FarewellComponent } from './farewell.component';
import { FeedbackComponent } from './feedback.component';
import { UserContainerModule } from '@flaps/common';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    RouterModule,
    UserContainerModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    SisProgressModule,
  ],
  declarations: [FarewellComponent, FeedbackComponent],
  exports: [],
})
export class FarewellModule {}
