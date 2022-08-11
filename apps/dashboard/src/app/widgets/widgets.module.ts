import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { STFSectionNavbarModule } from '@flaps/common';
import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { AddWidgetDialogModule } from './add/add-widget.module';
import { EditWidgetComponent } from './edit/edit-widget.component';

import { WidgetsComponent } from './widgets.component';

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
    PaDropdownModule,
    PaButtonModule,
    PaTogglesModule,
    AddWidgetDialogModule,
    AngularSvgIconModule,
    PaIconModule,
  ],
  exports: [],
  declarations: [EditWidgetComponent, WidgetsComponent],
  providers: [],
})
export class WidgetsModule {}
