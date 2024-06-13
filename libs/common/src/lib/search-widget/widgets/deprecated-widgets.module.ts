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
import { DeprecatedWidgetGeneratorComponent } from './deprecated-widget-generator.component';
import { CopilotModalComponent } from './copilot/copilot-modal.component';
import { LabelModule, UnauthorizedFeatureComponent } from '@flaps/core';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';

const routes = [
  {
    path: '',
    component: DeprecatedWidgetGeneratorComponent,
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
    InfoCardComponent,
    BadgeComponent,
    UnauthorizedFeatureComponent,
  ],
  exports: [],
  declarations: [DeprecatedWidgetGeneratorComponent, CopilotModalComponent],
  providers: [],
})
export class DeprecatedWidgetsModule {}
