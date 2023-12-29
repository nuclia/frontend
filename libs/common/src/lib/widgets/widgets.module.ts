import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { WidgetGeneratorComponent } from './widget-generator.component';
import { CopilotModalComponent } from './copilot/copilot-modal.component';
import { LabelModule } from '@flaps/common';

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
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    AngularSvgIconModule,
    PaButtonModule,
    PaExpanderModule,
    PaIconModule,
    PaModalModule,
    PaTabsModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaPopupModule,
    LabelModule,
  ],
  exports: [],
  declarations: [WidgetGeneratorComponent, CopilotModalComponent],
  providers: [],
})
export class WidgetsModule {}
