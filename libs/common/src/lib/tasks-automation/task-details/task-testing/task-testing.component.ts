import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  InfoCardComponent,
  SisProgressModule,
  SisToastService,
  TwoColumnsConfigurationItemComponent,
} from '@nuclia/sistema';
import { SDKService } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  PaButtonModule,
  PaDropdownModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { AugmentedField, IResource, Resource } from '@nuclia/core';
import { debounceTime, forkJoin, map, of, Subject, switchMap, take } from 'rxjs';
import { TestResultsComponent } from './test-results/test-results.component';
import { DataAugmentationTaskOnGoing, getOperationFromTaskName } from '../../tasks-automation.models';

export type TestResults = { resource: Resource; results: { [key: string]: AugmentedField } };

@Component({
  selector: 'app-task-testing',
  imports: [
    CommonModule,
    InfoCardComponent,
    PaButtonModule,
    PaDropdownModule,
    PaPopupModule,
    PaTableModule,
    PaTextFieldModule,
    PaTogglesModule,
    SisProgressModule,
    TestResultsComponent,
    TwoColumnsConfigurationItemComponent,
    TranslateModule,
  ],
  templateUrl: './task-testing.component.html',
  styleUrl: './task-testing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTestingComponent {
  private sdk = inject(SDKService);
  private cdr = inject(ChangeDetectorRef);
  private toaster = inject(SisToastService);

  updateSuggestions = new Subject<string>();
  resources: IResource[] = [];
  selected: { [id: string]: boolean } = {};
  loading = false;
  results?: TestResults[];
  tokens?: { input: number; output: number };

  @Input() task: DataAugmentationTaskOnGoing | undefined;

  suggestions = this.updateSuggestions.pipe(
    debounceTime(300),
    switchMap((value) =>
      this.sdk.currentKb.pipe(
        take(1),
        switchMap((kb) =>
          value.length > 2
            ? kb.catalog(value).pipe(map((res) => (res.type === 'error' ? [] : Object.values(res.resources || {}))))
            : of([]),
        ),
      ),
    ),
  );

  get selectedIds() {
    return Object.entries(this.selected)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }

  run() {
    this.loading = true;
    this.results = undefined;
    this.tokens = undefined;
    this.cdr.markForCheck();
    this.sdk.currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          forkJoin(
            this.selectedIds.map((id) => {
              const resource = kb.getResourceFromData(this.resources.find((res) => res.id === id) as IResource);
              return resource
                .runTasks([
                  {
                    type: getOperationFromTaskName(this.task?.task.name || 'ask') || 'ask',
                    task_names: [this.task?.parameters.name || ''],
                  },
                ])
                .pipe(map((results) => ({ results: results.results, resource })));
            }),
          ),
        ),
      )
      .subscribe({
        next: (results) => {
          this.loading = false;
          this.results = results;
          this.tokens = results.reduce(
            (acc, curr) =>
              Object.values(curr.results).reduce(
                (acc, curr) => ({
                  input: acc.input + curr.input_nuclia_tokens,
                  output: acc.output + curr.output_nuclia_tokens,
                }),
                acc,
              ),
            { input: 0, output: 0 },
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.toaster.error('tasks-automation.testing.error');
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  addResource(resource: IResource) {
    if (!Object.keys(this.selected).includes(resource.id)) {
      this.resources.push(resource);
      this.selected[resource.id] = true;
      this.cdr.markForCheck();
    }
  }

  clearResults() {
    this.results = undefined;
    this.tokens = undefined;
  }
}
