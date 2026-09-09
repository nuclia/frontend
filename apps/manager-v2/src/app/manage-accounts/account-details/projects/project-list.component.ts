import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Observable} from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { ProjectDetails } from '../../account-ui.models';

@Component({
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ProjectListComponent {
  private store = inject(ManagerStore);

  projectList: Observable<ProjectDetails[]> = this.store.projectList;
  canAccessProjects = this.store.canAccessProjects;
}
