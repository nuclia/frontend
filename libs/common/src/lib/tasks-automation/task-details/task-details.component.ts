import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaTabsModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { BackButtonComponent } from '@nuclia/sistema';
import { TaskRouteDirective } from '../task-route.directive';
import { TaskSettingsComponent } from '../task-forms/task-settings/task-settings.component';
import { TaskTestingComponent } from './task-testing/task-testing.component';
import { TaskName } from '@nuclia/core';

@Component({
  imports: [
    CommonModule,
    PaButtonModule,
    PaExpanderModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
    PaIconModule,
    PaTabsModule,
    BackButtonComponent,
    TaskSettingsComponent,
    TaskTestingComponent,
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskDetailsComponent extends TaskRouteDirective {
  selectedTab: 'configuration' | 'testing' = 'configuration';
  tasksSupportingTesting: TaskName[] = ['ask', 'labeler', 'llm-graph'];

  constructor() {
    super();
  }
}
