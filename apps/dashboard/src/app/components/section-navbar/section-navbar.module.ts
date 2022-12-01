import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import {
  SectionNavbarComponent,
  SectionNavbarFooterDirective,
  SectionNavbarBodyDirective,
  SectionNavbarHeaderDirective,
} from './section-navbar.component';
import { OverlayModule } from '@angular/cdk/overlay';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    OverlayModule,
  ],
  declarations: [
    SectionNavbarComponent,
    SectionNavbarFooterDirective,
    SectionNavbarBodyDirective,
    SectionNavbarHeaderDirective,
  ],
  exports: [
    SectionNavbarComponent,
    SectionNavbarFooterDirective,
    SectionNavbarBodyDirective,
    SectionNavbarHeaderDirective,
  ],
})
export class STFSectionNavbarModule {}
