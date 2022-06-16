import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { TourMatMenuModule } from 'ngx-ui-tour-md-menu';
import { STFButtonsModule } from '@flaps/pastanaga';

import { StashNavbarComponent } from './stash-navbar.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    MatDialogModule,
    TourMatMenuModule,
    STFButtonsModule,
  ],
  declarations: [StashNavbarComponent],
  exports: [StashNavbarComponent],
})
export class StashNavbarModule {}
