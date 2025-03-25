import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, ReplaySubject, switchMap, take, tap } from 'rxjs';
import {
  AutomatedTask,
  DataAugmentationTaskOnBatch,
  DataAugmentationTaskOnGoing,
  mapBatchToOneTimeTask,
  mapOnGoingToAutomatedTask,
  OneTimeTask,
  resolveSchemaReferences,
} from './tasks-automation.models';
import { ApplyOption, TaskFullDefinition, TaskListResponse, TaskName, TaskParameters } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class TasksAutomationService {
  private sdk = inject(SDKService);

  private _currentKb = this.sdk.currentKb;
  private _tasksData = new ReplaySubject<TaskListResponse>(1);
  taskList = this._tasksData.pipe(map((data) => this.mapTaskList(data)));
  taskDefinitions = this._tasksData.pipe(map((data) => this.resolveReferences(data.tasks)));

  initTaskList() {
    this.updateTasks().subscribe();
  }

  startTask(taskName: TaskName, parameters: TaskParameters, apply: ApplyOption) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.startTask(taskName, parameters, apply)),
      switchMap(() => this.updateTasks()),
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

  deleteTask(taskId: string, deleteData: boolean) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.deleteTask(taskId, deleteData)),
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

  updateTasks() {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTasks(1000)),
      tap((response) => this._tasksData.next(response)),
    );
  }

  getTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTask(taskId)),
      map((response) => response as { request: DataAugmentationTaskOnBatch; config: DataAugmentationTaskOnGoing }),
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
}
