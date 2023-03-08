import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { BillingComponent } from './billing.component';

const routes = [
  {
    path: '',
    component: BillingComponent,
    children: [],
  },
];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    AngularSvgIconModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    PaButtonModule,
    PaTextFieldModule,
    PaIconModule,
  ],
  declarations: [BillingComponent],
  exports: [],
})
export class BillingModule {}
