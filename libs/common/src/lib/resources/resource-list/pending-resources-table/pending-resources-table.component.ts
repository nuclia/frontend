import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ResourcesTableDirective } from '../resources-table.directive';
import { ColumnHeader } from '../resource-list.model';
import { combineLatest, map, Observable } from 'rxjs';
import { HeaderCell } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-pending-resources-table',
  templateUrl: './pending-resources-table.component.html',
  styleUrls: ['../resources-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PendingResourcesTableComponent extends ResourcesTableDirective {
  private defaultColumns: ColumnHeader[] = [
    { id: 'title', label: 'resource.title', size: '3fr' },
    {
      id: 'modification',
      label: 'generic.date',
      size: '128px',
      centered: true,
    },
    { id: 'status', label: 'resource.status', size: 'minmax(176px, 1fr)', centered: true },
  ];
  columns: Observable<ColumnHeader[]> = this.isAdminOrContrib.pipe(
    map((canEdit) =>
      canEdit
        ? [...this.defaultColumns, { id: 'menu', label: 'generic.actions', size: '96px' }]
        : [...this.defaultColumns],
    ),
  );
  headerCells: Observable<HeaderCell[]> = this.columns.pipe(map((cells) => cells.map((cell) => new HeaderCell(cell))));
  tableLayout: Observable<string> = combineLatest([this.isAdminOrContrib, this.columns]).pipe(
    map(([canEdit, cells]) => {
      const layout = cells.map((cell) => cell.size).join(' ');
      return canEdit ? `40px ${layout}` : layout;
    }),
  );
}
