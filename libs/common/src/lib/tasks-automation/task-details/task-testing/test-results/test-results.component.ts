import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { DataAugmentationTaskOnGoing } from '../../../tasks-automation.models';
import { GraphResultsComponent } from '../graph-results/graph-results.component';
import { LabelerResultsComponent } from '../labeler-results/labeler-results.component';
import { TestResults } from '../task-testing.component';

@Component({
  selector: 'app-test-results',
  imports: [CommonModule, GraphResultsComponent, LabelerResultsComponent, InfoCardComponent],
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResultsComponent {
  @Input({ required: true }) results: TestResults | undefined;
  @Input({ required: true }) task: DataAugmentationTaskOnGoing | undefined;
}
