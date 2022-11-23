import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { STFSectionNavbarModule } from '@flaps/common';
import {
  PaButtonModule,
  PaIconModule,
  PaModalModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AddWidgetDialogModule } from './add/add-widget.module';
import { EditWidgetComponent } from './edit/edit-widget.component';

import { WidgetsComponent } from './widgets.component';
import { WidgetHintDialogComponent } from './hint/widget-hint.component';

const routes = [
  {
    path: '',
    component: WidgetsComponent,
    children: [
      {
        path: ':id',
        component: EditWidgetComponent,
      },
    ],
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
    AddWidgetDialogModule,
    AngularSvgIconModule,
    PaIconModule,
    PaModalModule,
  ],
  exports: [],
  declarations: [EditWidgetComponent, WidgetsComponent, WidgetHintDialogComponent],
  providers: [],
})
export class WidgetsModule {}
