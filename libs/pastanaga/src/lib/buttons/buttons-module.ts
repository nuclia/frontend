import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { STFButtonLinkComponent } from './button-link.component';
import { STFButtonComponent } from './button.component';

@NgModule({
  declarations: [STFButtonComponent],
  imports: [CommonModule, TranslateModule, AngularSvgIconModule],
  exports: [STFButtonComponent],
})
export class STFButtonsModule {}

@NgModule({
  declarations: [STFButtonLinkComponent],
  imports: [CommonModule, TranslateModule, RouterModule, AngularSvgIconModule],
  exports: [STFButtonLinkComponent],
})
export class STFButtonsLinkModule {}