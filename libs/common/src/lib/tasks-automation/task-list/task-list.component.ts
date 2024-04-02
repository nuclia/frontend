import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskListItemComponent } from '../task-list-item/task-list-item.component';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, TaskListItemComponent, TranslateModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskListComponent {
  private router = inject(Router);
  private activeRoute = inject(ActivatedRoute);

  createTask(taskPath: string) {
    this.router.navigate([`./${taskPath}`], { relativeTo: this.activeRoute });
  }
}
