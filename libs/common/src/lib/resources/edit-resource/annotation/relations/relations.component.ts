import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EntityGroup } from '../../edit-resource.helpers';
import { EntityComponent } from 'libs/common/src/lib/entities/entity/entity.component';
import { BehaviorSubject, combineLatest, forkJoin, map, take, tap } from 'rxjs';
import { TasksAutomationService } from 'libs/common/src/lib/tasks-automation';
import { EditResourceService } from '../../edit-resource.service';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { Relation } from '@nuclia/core';

@Component({
  selector: 'app-relations',
  imports: [CommonModule, EntityComponent, PaTogglesModule, TranslateModule],
  templateUrl: './relations.component.html',
  styleUrls: ['./relations.component.scss', '../../common-page-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RelationsComponent {
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
    this.editResource.currentFieldData.pipe(
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

  constructor(
    private editResource: EditResourceService,
    private tasksAutomation: TasksAutomationService,
  ) {}

  toggleFilter(filter: string) {
    const currentFilters = this.selectedFilters.getValue();
    this.selectedFilters.next(
      currentFilters.includes(filter)
        ? currentFilters.filter((value) => value !== filter)
        : [...currentFilters, filter],
    );
  }
}
