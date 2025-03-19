import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TestResults } from '../task-testing.component';
import { TaskWithApplyOption } from '../../../task-route.directive';
import { LabelerResultsComponent } from '../labeler-results/labeler-results.component';
import { GraphResultsComponent } from '../graph-results/graph-results.component';

@Component({
  selector: 'app-test-results',
  imports: [CommonModule, GraphResultsComponent, LabelerResultsComponent, InfoCardComponent, TranslateModule],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResultsComponent {
  @Input({required: true}) results: TestResults | undefined;
  @Input({required: true}) task: TaskWithApplyOption | undefined;
}
