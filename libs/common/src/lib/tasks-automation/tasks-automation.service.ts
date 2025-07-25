import { inject, Injectable } from '@angular/core';
import { NavigationService, SDKService } from '@flaps/core';
import { combineLatest, filter, forkJoin, map, merge, of, shareReplay, Subject, switchMap, take, tap } from 'rxjs';
import {
  AutomatedTask,
  DataAugmentationTaskOnBatch,
  DataAugmentationTaskOnGoing,
  mapBatchToOneTimeTask,
  mapOnGoingToAutomatedTask,
  OneTimeTask,
  resolveSchemaReferences,
} from './tasks-automation.models';
import { TaskFullDefinition, TaskListResponse, TaskName, TaskParameters } from '@nuclia/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { Router } from '@angular/router';
import { TaskDuplicateDialogComponent } from './task-list/task-duplicate-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class TasksAutomationService {
  private sdk = inject(SDKService);
  private modalService = inject(SisModalService);
  private toaster = inject(SisToastService);
  private navigation = inject(NavigationService);
  private router = inject(Router);

  private _currentKb = this.sdk.currentKb;
  private _initialData = this._currentKb.pipe(switchMap((kb) => kb.taskManager.getTasks(1000)));
  private _updatedData = new Subject<TaskListResponse>();
  private _tasksData = merge(this._initialData, this._updatedData).pipe(shareReplay(1));

  configs = this._tasksData.pipe(map((data) => data.configs as DataAugmentationTaskOnGoing[]));
  taskList = this._tasksData.pipe(map((data) => this.mapTaskList(data)));
  taskDefinitions = this._tasksData.pipe(map((data) => this.resolveReferences(data.tasks)));
  tasksRoute = this.navigation.kbUrl.pipe(map((kbUrl) => `${kbUrl}/tasks`));

  startTask(taskName: TaskName, parameters: TaskParameters) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.startTask(taskName, parameters, 'NEW', false)),
      switchMap((res) => this.updateTasks().pipe(map(() => res))),
    );
  }

  duplicateTask(taskId: string) {
    return this.modalService.openModal(TaskDuplicateDialogComponent).onClose.pipe(
      filter((name) => !!name),
      switchMap((name) =>
        this.configs.pipe(
          take(1),
          map((configs) => configs.find((task) => task.id === taskId)),
          filter((task) => !!task),
          switchMap((task) => {
            const parameters = task.parameters;
            parameters.name = name;
            parameters.operations = parameters.operations?.map((operation) => {
              if (operation.ask) {
                operation.ask.destination = `${operation.ask.destination}_copy`;
              }
              return operation;
            });
            return this.startTask(task.task.name, parameters);
          }),
          switchMap((res) => this.goToEditTask(res.id)),
        ),
      ),
    );
  }

  editTask(taskId: string, parameters: TaskParameters) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.editTask(taskId, parameters)),
      switchMap(() => this.updateTasks()),
    );
  }

  stopTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.stopTask(taskId)),
      switchMap(() => this.updateTasks()),
    );
  }

  restartTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.restartTask(taskId)),
      switchMap(() => this.updateTasks()),
    );
  }

  cleanTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.cleanTask(taskId)),
      switchMap(() => this.updateTasks()),
    );
  }

  enableTask(taskId: string, enabled: boolean) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.enableTask(taskId, enabled)),
      switchMap(() => this.updateTasks()),
    );
  }

  startBatchTask(taskName: TaskName, taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.startTask(taskName, undefined, undefined, undefined, taskId)),
      switchMap(() => this.updateTasks()),
    );
  }

  updateTasks() {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTasks(1000)),
      tap((response) => this._updatedData.next(response)),
    );
  }

  getTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTask(taskId)),
      map((response) => response as { request?: DataAugmentationTaskOnBatch; config?: DataAugmentationTaskOnGoing }),
    );
  }

  deleteBatchTasks(configId: string) {
    return combineLatest([this._currentKb, this.getBatchTasks(configId)]).pipe(
      take(1),
      switchMap(([kb, batchTasks]) =>
        batchTasks.length > 0 ? forkJoin(batchTasks.map((task) => kb.taskManager.deleteTask(task.id))) : of(undefined),
      ),
      switchMap((res) => (res ? this.updateTasks() : of(undefined))),
    );
  }

  stopBatchTasks(configId: string) {
    return combineLatest([this._currentKb, this.getBatchTasks(configId, 'progress')]).pipe(
      take(1),
      switchMap(([kb, batchTasks]) =>
        batchTasks.length > 0 ? forkJoin(batchTasks.map((task) => kb.taskManager.stopTask(task.id))) : of(undefined),
      ),
      switchMap((res) => (res ? this.updateTasks() : of(undefined))),
    );
  }

  getBatchTasks(configId: string, status?: string) {
    return this.taskList.pipe(
      take(1),
      map((taskList) =>
        taskList
          .filter((task) => task.type === 'one-time' && task.task_config_id === configId)
          .map((task) => task as OneTimeTask)
          .filter((task) => (status ? task.status === status : true)),
      ),
    );
  }

  deleteOnGoingTask(configId: string, deleteData: boolean) {
    return this.modalService
      .openConfirm({
        title: `tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.title`,
        description: `tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.description`,
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.stopBatchTasks(configId)),
        switchMap(() => this.deleteBatchTasks(configId)),
        switchMap(() => this._currentKb.pipe(take(1))),
        switchMap((kb) => kb.taskManager.deleteTask(configId, deleteData)),
        switchMap(() => this.updateTasks()),
        tap(() => {
          this.toaster.success(`tasks-automation.actions.${deleteData ? 'delete-all' : 'delete-agent'}.success`);
        }),
      );
  }

  cleanOnGoingTask(configId: string) {
    return this.modalService
      .openConfirm({
        title: 'tasks-automation.actions.delete-data.title',
        description: 'tasks-automation.actions.delete-data.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.stopBatchTasks(configId)),
        switchMap(() => this.cleanTask(configId)),
        tap(() => {
          this.toaster.success('tasks-automation.actions.delete-data.success');
        }),
      );
  }

  private mapTaskList(response: TaskListResponse) {
    const taskList: (AutomatedTask | OneTimeTask)[] = [];

    response.running
      .filter((task) => task.task.data_augmentation && !task.cleanup_parent_task_id)
      .map((task) => task as DataAugmentationTaskOnBatch)
      .forEach((task) => taskList.push(mapBatchToOneTimeTask(task)));
    response.done
      .filter((task) => task.task.data_augmentation && !task.cleanup_parent_task_id)
      .map((task) => task as DataAugmentationTaskOnBatch)
      .forEach((task) => taskList.push(mapBatchToOneTimeTask(task)));
    response.configs
      .filter((item) => item.task.data_augmentation)
      .map((task) => task as DataAugmentationTaskOnGoing)
      .forEach((task) => taskList.push(mapOnGoingToAutomatedTask(task)));

    return taskList;
  }

  private resolveReferences(tasks: TaskFullDefinition[]) {
    return tasks.map((task) => {
      return {
        ...task,
        validation: {
          ...task.validation,
          properties: resolveSchemaReferences(task.validation.properties, task.validation.$defs),
        },
      };
    });
  }

  goToEditTask(taskId: string) {
    return this.configs.pipe(
      take(1),
      map((configs) => configs.find((config) => config.id === taskId)),
      filter((task) => !!task),
      switchMap((task) =>
        this.getBatchTasks(task.id, 'progress').pipe(
          switchMap((activeTasks) =>
            (activeTasks.length > 0
              ? this.modalService
                  .openConfirm({
                    title: 'tasks-automation.actions.edit.title',
                    description: 'tasks-automation.actions.edit.description',
                    confirmLabel: 'generic.continue',
                  })
                  .onClose.pipe(
                    filter((confirm) => confirm),
                    switchMap(() => this.stopBatchTasks(task.id)),
                  )
              : of(undefined)
            ).pipe(
              switchMap(() =>
                this.tasksRoute.pipe(
                  take(1),
                  map((path) => ({ path, task })),
                ),
              ),
            ),
          ),
          tap(({ path, task }) => {
            this.router.navigate([`${path}/${task?.task.name}/${task?.id}`]);
          }),
        ),
      ),
    );
  }
}
