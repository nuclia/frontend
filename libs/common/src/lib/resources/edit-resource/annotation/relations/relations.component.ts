import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { BehaviorSubject, combineLatest, forkJoin, map, take, tap } from 'rxjs';

import { EditResourceService, EntityGroup } from '@flaps/core';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { Relation } from '@nuclia/core';
import { EntityComponent } from '../../../../entities/entity/entity.component';
import { TasksAutomationService } from '../../../../tasks-automation';

@Component({
  selector: 'app-relations',
  imports: [CommonModule, EntityComponent, PaTogglesModule, TranslateModule],
  templateUrl: './relations.component.html',
  styleUrls: ['./relations.component.scss', '../../common-page-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationsComponent {
  private editResource = inject(EditResourceService);
  private tasksAutomation = inject(TasksAutomationService);

  @Input() set entityFamilies(value: EntityGroup[] | undefined) {
    if (value) {
      this.colors = value.reduce(
        (acc, curr) => {
          acc[curr.id] = curr.color;
          return acc;
        },
        {} as { [id: string]: string },
      );
    }
  }
  colors: { [id: string]: string } = {};

  selectedFilters = new BehaviorSubject<string[]>([]);
  relations = forkJoin([
    this.editResource.fieldExtractedData.pipe(
      map((field) => field?.extracted?.metadata?.metadata.relations || []),
      take(1),
    ),
    this.editResource.resource.pipe(
      map((res) => res?.usermetadata?.relations),
      take(1),
    ),
  ]).pipe(map(([fieldRelations, resourceRelations]) => [...fieldRelations, ...(resourceRelations || [])]));
  taskNames = this.tasksAutomation.configs.pipe(
    map((tasks) =>
      tasks.reduce(
        (acc, curr) => {
          const id = curr.parameters?.operations?.[0]?.graph?.ident;
          if (id) {
            acc[id] = curr.parameters.name;
          }
          return acc;
        },
        {} as { [id: string]: string },
      ),
    ),
  );
  noRelations = this.relations.pipe(map((relations) => relations.length === 0));
  relationFilters = this.relations.pipe(
    map((relations) =>
      relations.reduce((acc, curr) => {
        const id = curr.metadata?.data_augmentation_task_id;
        if (!!id && !acc.includes(id)) {
          acc.push(id);
        }
        return acc;
      }, [] as string[]),
    ),
    tap((filters) => this.selectedFilters.next(['default', ...filters])),
  );
  filteredRelations = combineLatest([this.relations, this.selectedFilters]).pipe(
    map(([relations, selected]) =>
      relations.reduce(
        (acc, curr) => {
          const group = curr.metadata?.data_augmentation_task_id || 'default';
          if (!selected.includes(group)) {
            return acc;
          }
          if (acc[group]) {
            acc[group].push(curr);
          } else {
            acc[group] = [curr];
          }
          return acc;
        },
        {} as { [group: string]: Relation[] },
      ),
    ),
  );

  toggleFilter(filter: string) {
    const currentFilters = this.selectedFilters.getValue();
    this.selectedFilters.next(
      currentFilters.includes(filter)
        ? currentFilters.filter((value) => value !== filter)
        : [...currentFilters, filter],
    );
  }
}
