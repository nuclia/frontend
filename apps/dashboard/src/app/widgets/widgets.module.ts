import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { WidgetGeneratorComponent } from './widget-generator.component';

import { WidgetHintDialogComponent } from './hint/widget-hint.component';
import { STFSectionNavbarModule } from '../components/section-navbar';

const routes = [
  {
    path: '',
    component: WidgetGeneratorComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    TranslateModule.forChild(),
    STFSectionNavbarModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    PaTextFieldModule,
    PaButtonModule,
    PaTogglesModule,
    AngularSvgIconModule,
    PaIconModule,
    PaModalModule,
  ],
  exports: [],
  declarations: [WidgetGeneratorComponent, WidgetHintDialogComponent],
  providers: [],
})
export class WidgetsModule {}
