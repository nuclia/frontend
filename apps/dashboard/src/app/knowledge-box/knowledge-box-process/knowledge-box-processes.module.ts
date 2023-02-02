import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaPopupModule,
  PaTogglesModule,
  PaTableModule,
  PaScrollModule,
} from '@guillotinaweb/pastanaga-angular';
import { KnowledgeBoxProcessesComponent } from './knowledge-box-processes.component';
import { TrainingHistoryComponent } from './training-history/training-history.component';
import { BackButtonComponent, DropdownButtonComponent } from '@nuclia/sistema';

const ROUTES = [
  {
    path: '',
    component: KnowledgeBoxProcessesComponent,
  },
  {
    path: 'history',
    component: TrainingHistoryComponent,
  },
];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    TranslateModule.forChild(),
    RouterModule.forChild(ROUTES),
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    PaButtonModule,
    PaDropdownModule,
    PaTogglesModule,
    PaPopupModule,
    PaIconModule,
    PaTableModule,
    PaScrollModule,
    DropdownButtonComponent,
    BackButtonComponent,
  ],
  declarations: [KnowledgeBoxProcessesComponent, TrainingHistoryComponent],
  exports: [],
})
export class KnowledgeBoxProcessesModule {}
