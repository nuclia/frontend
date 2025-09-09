import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InfoCardComponent, LABEL_COLORS, LabelColor } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { TestResults } from '../task-testing.component';
import { Relation } from '@nuclia/core';
import { combineLatest, map, ReplaySubject } from 'rxjs';
import { DataAugmentationTaskOnGoing } from '../../../tasks-automation.models';
import { EntityComponent } from 'libs/common/src/lib/entities/entity/entity.component';

@Component({
  selector: 'app-graph-results',
  imports: [CommonModule, EntityComponent, InfoCardComponent, TranslateModule],
  templateUrl: './graph-results.component.html',
  styleUrl: './graph-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GraphResultsComponent {
  resultsSubject = new ReplaySubject<TestResults>(1);

  @Input({ required: true })
  set results(value: TestResults | undefined) {
    if (value) {
      this.resultsSubject.next(value);
    }
  }

  @Input({ required: true }) task: DataAugmentationTaskOnGoing | undefined;

  extractedNERs = this.resultsSubject.pipe(
    map((results) => {
      const operationId = this.task?.parameters.operations?.[0].graph?.ident || '';
      return Object.values(results.results).reduce(
        (acc, field) => {
          const entities = field.metadata.entities[operationId || ''].entities || [];
          entities.forEach((entity) => {
            if (acc[entity.label]) {
              acc[entity.label].push(entity.text);
            } else {
              acc[entity.label] = [entity.text];
            }
          });
          return acc;
        },
        {} as { [family: string]: string[] },
      );
    }),
  );

  familyColors = this.extractedNERs.pipe(
    map((families) =>
      Object.keys(families).reduce(
        (colors, family, index) => ({
          ...colors,
          [family]: LABEL_COLORS[index % LABEL_COLORS.length],
        }),
        {} as { [family: string]: LabelColor },
      ),
    ),
  );

  relations = combineLatest([this.resultsSubject, this.familyColors]).pipe(
    map(([results, colors]) => {
      const operationId = this.task?.parameters.operations?.[0].graph?.ident || '';
      return Object.values(results.results).reduce(
        (acc, field) => {
          const relations = (field.metadata.relations || [])
            .filter((relation) => relation.metadata?.data_augmentation_task_id === operationId)
            .map((relation) => ({
              ...relation,
              fromColor: colors[relation.from?.group || ''],
              toColor: colors[relation.to.group || ''],
            }));
          return acc.concat(relations);
        },
        [] as (Relation & { fromColor: LabelColor; toColor: LabelColor })[],
      );
    }),
  );
}
