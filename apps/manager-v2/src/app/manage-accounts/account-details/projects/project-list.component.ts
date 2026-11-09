import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmTableImports } from '@nuclia/ui-spartan/table';
import { ManagerStore } from '../../../manager.store';

@Component({
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmTableImports, RouterLink],
})
export class ProjectListComponent {
  private store = inject(ManagerStore);

  projectList = this.store.projectList;
  canAccessProjects = this.store.canAccessProjects;
}
