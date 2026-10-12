import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { Observable } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { ProjectDetails } from '../../account-ui.models';

@Component({
  templateUrl: './project-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaTableModule, RouterLink, AsyncPipe],
})
export class ProjectListComponent {
  private store = inject(ManagerStore);

  projectList: Observable<ProjectDetails[]> = this.store.projectList;
  canAccessProjects = this.store.canAccessProjects;
}
