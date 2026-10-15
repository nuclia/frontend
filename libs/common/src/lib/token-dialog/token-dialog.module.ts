import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AngularSvgIconModule } from 'angular-svg-icon';

import { PaButtonModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TokenDialogComponent } from './token-dialog.component';

@NgModule({
  imports: [CommonModule, AngularSvgIconModule, PaButtonModule, PaModalModule, TokenDialogComponent],
  exports: [TokenDialogComponent],
})
export class TokenDialogModule {}
